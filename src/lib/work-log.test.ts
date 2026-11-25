import { describe, it, expect, beforeAll, afterAll } from "vitest";
import prisma from "@/lib/prisma";
import { UserRole, WorkLogStatus, PlacementStatus, NotificationType } from "@prisma/client";

describe("WorkLog & FinalEvaluation Test Suite (Cerința 7 P14)", () => {
  let studentUser: any;
  let companyUser: any;
  let testCompany: any;
  let testOffer: any;
  let testPlacement: any;

  beforeAll(async () => {
    const timestamp = Date.now();

    // 1. Creare student
    studentUser = await prisma.user.create({
      data: {
        email: `student-wl-${timestamp}@student.ulbsibiu.ro`,
        passwordHash: "hash",
        firstName: "Ionel",
        lastName: "Practicant",
        role: UserRole.STUDENT,
        studentProfile: {
          create: {
            specialization: "Calculatoare",
            studyYear: 3,
            group: "331",
            domain: "COMPUTER_SCIENCE_IT",
          },
        },
      },
      include: { studentProfile: true },
    });

    // 2. Creare companie și ofertă
    companyUser = await prisma.user.create({
      data: {
        email: `company-wl-${timestamp}@techcorp.ro`,
        passwordHash: "hash",
        firstName: "Mihai",
        lastName: "Tutore",
        role: UserRole.COMPANY_TUTOR,
        companyProfile: {
          create: {
            companyName: "TechCorp Labs",
            cuiCif: `RO${timestamp.toString().slice(-8)}`,
            address: "Str. Inovatiei nr. 1",
            city: "Sibiu",
          },
        },
      },
      include: { companyProfile: true },
    });

    testOffer = await prisma.internshipOffer.create({
      data: {
        companyId: companyUser.companyProfile.id,
        title: "Fullstack Web Developer",
        description: "Stagiu practică React & Next.js",
        location: "Sibiu",
        startDate: new Date("2026-07-01"),
        endDate: new Date("2026-07-21"),
        tutorName: "Mihai Tutore",
        tutorEmail: companyUser.email,
        slotsTotal: 2,
        slotsAvailable: 1,
      },
    });

    // 3. Creare plasament confirmat
    testPlacement = await prisma.placement.create({
      data: {
        studentId: studentUser.studentProfile.id,
        offerId: testOffer.id,
        status: PlacementStatus.CONFIRMED,
      },
    });
  });

  afterAll(async () => {
    // Curățare date de test
    if (testPlacement) {
      await prisma.workLog.deleteMany({ where: { placementId: testPlacement.id } });
      await prisma.finalEvaluation.deleteMany({ where: { placementId: testPlacement.id } });
      await prisma.placement.deleteMany({ where: { id: testPlacement.id } });
    }
    if (testOffer) {
      await prisma.internshipOffer.deleteMany({ where: { id: testOffer.id } });
    }
    if (studentUser) {
      await prisma.notification.deleteMany({ where: { userId: studentUser.id } });
      await prisma.studentProfile.deleteMany({ where: { userId: studentUser.id } });
      await prisma.user.deleteMany({ where: { id: studentUser.id } });
    }
    if (companyUser) {
      await prisma.notification.deleteMany({ where: { userId: companyUser.id } });
      await prisma.companyProfile.deleteMany({ where: { userId: companyUser.id } });
      await prisma.user.deleteMany({ where: { id: companyUser.id } });
    }
  });

  it("permite adăugarea unei intrări de pontaj cu status PENDING", async () => {
    const log = await prisma.workLog.create({
      data: {
        placementId: testPlacement.id,
        date: new Date("2026-07-05"),
        hoursWorked: 6,
        activitySummary: "Configurare mediu Next.js și creare layout inițial",
        status: WorkLogStatus.PENDING,
      },
    });

    expect(log).toBeDefined();
    expect(log.hoursWorked).toBe(6);
    expect(log.status).toBe(WorkLogStatus.PENDING);
    expect(log.validatedAt).toBeNull();
  });

  it("permite tutorelui să valideze intrarea de pontaj cu feedback opțional", async () => {
    const existingLog = await prisma.workLog.findFirst({
      where: { placementId: testPlacement.id },
    });
    expect(existingLog).toBeDefined();

    const validatedLog = await prisma.workLog.update({
      where: { id: existingLog!.id },
      data: {
        status: WorkLogStatus.VALIDATED_TUTOR,
        validatedAt: new Date(),
        tutorFeedback: "Activitate excelentă, cod curat.",
      },
    });

    expect(validatedLog.status).toBe(WorkLogStatus.VALIDATED_TUTOR);
    expect(validatedLog.validatedAt).toBeInstanceOf(Date);
    expect(validatedLog.tutorFeedback).toBe("Activitate excelentă, cod curat.");
  });

  it("permite respingerea unui pontaj cu motiv specificat", async () => {
    const secondLog = await prisma.workLog.create({
      data: {
        placementId: testPlacement.id,
        date: new Date("2026-07-06"),
        hoursWorked: 8,
        activitySummary: "Activitate de weekend nedeclarată în orar",
        status: WorkLogStatus.PENDING,
      },
    });

    const rejectedLog = await prisma.workLog.update({
      where: { id: secondLog.id },
      data: {
        status: WorkLogStatus.REJECTED,
        validatedAt: new Date(),
        tutorFeedback: "Orele în weekend necesită aprobare prealabilă.",
      },
    });

    expect(rejectedLog.status).toBe(WorkLogStatus.REJECTED);
    expect(rejectedLog.tutorFeedback).toContain("weekend");
  });

  it("calculează corect totalul orelor validate vs ore în așteptare", async () => {
    const logs = await prisma.workLog.findMany({
      where: { placementId: testPlacement.id },
    });

    const validatedHours = logs
      .filter((l) => l.status === WorkLogStatus.VALIDATED_TUTOR)
      .reduce((sum, l) => sum + l.hoursWorked, 0);

    expect(validatedHours).toBe(6);
  });

  it("permite salvarea și actualizarea fișei de evaluare finală", async () => {
    const evaluation = await prisma.finalEvaluation.upsert({
      where: { placementId: testPlacement.id },
      create: {
        placementId: testPlacement.id,
        grade: 9.5,
        feedback: "Student foarte conștiincios și adaptabil, recomandat pentru angajare.",
        competenciesAcquired: ["Next.js", "Tailwind CSS", "Prisma ORM", "TypeScript"],
        evaluatorName: "Mihai Tutore",
      },
      update: {
        grade: 10.0,
      },
    });

    expect(evaluation).toBeDefined();
    expect(evaluation.grade).toBe(9.5);
    expect(evaluation.competenciesAcquired).toContain("TypeScript");
    expect(evaluation.evaluatorName).toBe("Mihai Tutore");

    // Actualizare notă
    const updatedEval = await prisma.finalEvaluation.update({
      where: { placementId: testPlacement.id },
      data: { grade: 10.0 },
    });

    expect(updatedEval.grade).toBe(10.0);
  });
});
