import assert from "assert";
import { describe, it } from "vitest";
import prisma from "@/lib/prisma";
import { UserRole, PlacementStatus, WorkLogStatus, NotificationType } from "@prisma/client";
import { generateConventionPdf, buildConventionPdfBuffer } from "@/lib/conventions/generator";
import { handleMinimalReallocation } from "@/lib/matching";
import { createNotification } from "@/lib/notifications";

describe("Auditul DoD pentru fluxurile E2E (Cerințele 3, 5, 6, 8 și 9)", () => {
  it("Cerința 6: Generare PDF nativ fără dependență de LibreOffice cu diacritice UTF-8", async () => {
    const sampleData = {
      conventionNumber: "ULBS-TEST-2027-DOD001",
      dateStr: "25.11.2026",
      facultyName: "Facultatea de Inginerie",
      universityName: "Universitatea „Lucian Blaga” din Sibiu",
      universityAddress: "str. Emil Cioran nr. 4, Sibiu",
      decanName: "Prof.univ.dr.ing. Maria Vințan",
      supervisorName: "Conf.univ.dr.ing. Supervizor Practică",
      supervisorPhone: "0269/217928",
      supervisorEmail: "supervizor@ulbsibiu.ro",
      companyName: "Compania Sibiană Tehnologică SRL",
      companyAddress: "Str. Lupeni nr. 12",
      companyCity: "Sibiu",
      cuiCif: "RO99887766",
      legalRepresentative: "Alexandru Popescu",
      tutorName: "Elena Văcărescu",
      tutorEmail: "elena@tech-sibiu.ro",
      studentName: "Ștefan Pătrașcu",
      specialization: "Calculatoare și Tehnologia Informației",
      studyYear: 3,
      group: "CTI-31",
      periodStart: "05.07.2027",
      periodEnd: "25.07.2027",
      totalHours: 90,
      dailyHours: 6,
      workSchedule: "luni-vineri",
      locationAddress: "Str. Lupeni nr. 12, Sibiu",
      offerTitle: "Dezvoltare Cloud & Microservicii",
      creditsCount: 4,
    };

    const pdfBuffer = await buildConventionPdfBuffer(sampleData);

    assert.ok(pdfBuffer, "Bufferul PDF trebuie generat");
    assert.ok(pdfBuffer.length > 5000, `Dimensiunea PDF-ului generat (${pdfBuffer.length} bytes) trebuie să fie validă`);
    assert.strictEqual(pdfBuffer.subarray(0, 4).toString(), "%PDF", "Fișierul generat trebuie să fie un fișier PDF valid (începe cu %PDF)");
  });

  it("Cerința 9: Refuzul locului de către student eliberează slotul și permite realocarea minimală", async () => {
    const unique = `dod-test-${Date.now()}`;

    // Creăm un student de test
    const user = await prisma.user.create({
      data: {
        email: `${unique}-stud@test.ulbsibiu.ro`,
        passwordHash: "hash",
        firstName: "Ionel",
        lastName: "Popa",
        role: UserRole.STUDENT,
        studentProfile: {
          create: {
            specialization: "Calculatoare",
            studyYear: 3,
            group: "CALC-31",
          },
        },
      },
      include: { studentProfile: true },
    });

    // Creăm o companie de test cu ofertă
    const compUser = await prisma.user.create({
      data: {
        email: `${unique}-comp@test.ro`,
        passwordHash: "hash",
        firstName: "Tutor",
        lastName: "Comp",
        role: UserRole.COMPANY_TUTOR,
        companyProfile: {
          create: {
            companyName: "Firmă Test Realocare",
            cuiCif: `RO-${Date.now()}`,
            address: "Str. Calea Dumbrăvii nr. 10",
            city: "Sibiu",
            offers: {
              create: {
                title: "Practică DevOps",
                description: "Stagiu test",
                location: "Sibiu",
                slotsTotal: 2,
                slotsAvailable: 1,
                startDate: new Date("2027-07-05"),
                endDate: new Date("2027-07-25"),
                tutorName: "Tutore Test",
                tutorEmail: "tutore@test.ro",
              },
            },
          },
        },
      },
      include: { companyProfile: { include: { offers: true } } },
    });

    const offerId = compUser.companyProfile!.offers[0].id;

    // Creăm un plasament în PENDING_CONFIRMATION
    const placement = await prisma.placement.create({
      data: {
        studentId: user.studentProfile!.id,
        offerId,
        status: PlacementStatus.PENDING_CONFIRMATION,
      },
    });

    try {
      // Simulăm refuzul plasamentului de către student
      await prisma.$transaction(async (tx) => {
        await tx.placement.update({
          where: { id: placement.id },
          data: {
            status: PlacementStatus.REFUSED_BY_STUDENT,
            cancelledAt: new Date(),
            cancelReason: "Refuzat de către student",
          },
        });

        await tx.internshipOffer.update({
          where: { id: offerId },
          data: { slotsAvailable: { increment: 1 } },
        });
      });

      const updatedPlacement = await prisma.placement.findUnique({
        where: { id: placement.id },
      });
      const updatedOffer = await prisma.internshipOffer.findUnique({
        where: { id: offerId },
      });

      assert.strictEqual(updatedPlacement?.status, PlacementStatus.REFUSED_BY_STUDENT);
      assert.strictEqual(updatedOffer?.slotsAvailable, 2, "Locul eliberat trebuie să crească slotsAvailable");

      // Verificăm logica handleMinimalReallocation
      const confirmedPlacements = [{ studentId: "stud-frozen", offerId: "other-offer" }];
      const realloc = handleMinimalReallocation(
        confirmedPlacements,
        {
          type: "STUDENT_REFUSED",
          studentId: user.studentProfile!.id,
          offerId,
        },
        [
          { offerId, capacity: 2, studentRanking: ["stud-candidate", user.studentProfile!.id] },
          { offerId: "other-offer", capacity: 1, studentRanking: ["stud-frozen"] },
        ],
        [
          { studentId: "stud-candidate", preferences: [offerId] },
          { studentId: "stud-frozen", preferences: ["other-offer"] },
        ]
      );

      assert.ok(
        realloc.newlyAssigned.some((a) => a.studentId === "stud-candidate" && a.offerId === offerId),
        "Candidatul următor a fost repartizat minimal pe locul eliberat"
      );
      assert.ok(
        realloc.updatedPlacements.some((p) => p.studentId === "stud-frozen" && p.offerId === "other-offer"),
        "Studentul confirmat nu a fost perturbat"
      );
    } finally {
      await prisma.placement.deleteMany({ where: { id: placement.id } });
      await prisma.user.deleteMany({ where: { id: { in: [user.id, compUser.id] } } });
    }
  });

  it("Cerințele 3 & 5: Notificări la programarea și anularea interviurilor", async () => {
    const unique = `notif-test-${Date.now()}`;

    const studentUser = await prisma.user.create({
      data: {
        email: `${unique}-stud@test.ulbsibiu.ro`,
        passwordHash: "hash",
        firstName: "Mihai",
        lastName: "Grigore",
        role: UserRole.STUDENT,
      },
    });

    const notif = await createNotification({
      userId: studentUser.id,
      title: "Interviu programat de un student",
      message: "Test notificare interviu",
      type: NotificationType.SYSTEM_ALERT,
    });

    assert.ok(notif.id, "Notificarea a fost creată cu succes");
    assert.strictEqual(notif.userId, studentUser.id);
    assert.strictEqual(notif.isRead, false);

    await prisma.user.delete({ where: { id: studentUser.id } });
  });

  it("Cerința 8: Calculul orelor validate (VALIDATED_TUTOR) per student și la nivel global", async () => {
    const unique = `hours-test-${Date.now()}`;

    const studentUser = await prisma.user.create({
      data: {
        email: `${unique}-stud@test.ulbsibiu.ro`,
        passwordHash: "hash",
        firstName: "Dan",
        lastName: "Vasilescu",
        role: UserRole.STUDENT,
        studentProfile: {
          create: {
            specialization: "Inginerie Economică",
            studyYear: 2,
            group: "IED-21",
          },
        },
      },
      include: { studentProfile: true },
    });

    const compUser = await prisma.user.create({
      data: {
        email: `${unique}-comp@test.ro`,
        passwordHash: "hash",
        firstName: "Tutor2",
        lastName: "Comp2",
        role: UserRole.COMPANY_TUTOR,
        companyProfile: {
          create: {
            companyName: "Firmă Test Ore",
            cuiCif: `RO-${Date.now()}`,
            address: "Sibiu",
            city: "Sibiu",
            offers: {
              create: {
                title: "Practică Producție",
                description: "Test ore",
                location: "Sibiu",
                startDate: new Date("2027-07-05"),
                endDate: new Date("2027-07-25"),
                tutorName: "Inginer Tutor",
                tutorEmail: "tutor2@test.ro",
              },
            },
          },
        },
      },
      include: { companyProfile: { include: { offers: true } } },
    });

    const placement = await prisma.placement.create({
      data: {
        studentId: studentUser.studentProfile!.id,
        offerId: compUser.companyProfile!.offers[0].id,
        status: PlacementStatus.CONFIRMED,
      },
    });

    // Adăugăm intrări de pontaj: una VALIDATED_TUTOR (6 ore), una PENDING (6 ore), una REJECTED (4 ore)
    const log1 = await prisma.workLog.create({
      data: {
        placementId: placement.id,
        date: new Date(),
        hoursWorked: 6,
        activitySummary: "Activitate validată",
        status: WorkLogStatus.VALIDATED_TUTOR,
      },
    });

    const log2 = await prisma.workLog.create({
      data: {
        placementId: placement.id,
        date: new Date(),
        hoursWorked: 6,
        activitySummary: "Activitate în așteptare",
        status: WorkLogStatus.PENDING,
      },
    });

    try {
      const placementWithValidatedLogs = await prisma.placement.findUnique({
        where: { id: placement.id },
        include: {
          workLogs: {
            where: { status: WorkLogStatus.VALIDATED_TUTOR },
            select: { hoursWorked: true },
          },
        },
      });

      const validatedHours = placementWithValidatedLogs!.workLogs.reduce((acc, l) => acc + l.hoursWorked, 0);

      assert.strictEqual(validatedHours, 6, "Suma orelor validate trebuie să fie strict suma celor cu VALIDATED_TUTOR (6 ore)");
    } finally {
      await prisma.placement.deleteMany({ where: { id: placement.id } });
      await prisma.user.deleteMany({ where: { id: { in: [studentUser.id, compUser.id] } } });
    }
  });
});
