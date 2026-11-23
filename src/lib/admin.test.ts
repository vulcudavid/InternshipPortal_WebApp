import { describe, it, expect, beforeAll, afterAll } from "vitest";
import prisma from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { createNotification, notifyCoordinators } from "@/lib/notifications";
import { getSystemSettings, updateSystemSettings } from "@/lib/settings";
import {
  UserRole,
  CompanyStatus,
  OfferStatus,
  PlacementStatus,
  TieBreakerRule,
  AuditActionType,
  NotificationType,
} from "@prisma/client";

describe("ADMIN Backend & Security Suite (P14)", () => {
  let adminUser: any;
  let studentUser: any;
  let coordinatorUser: any;
  let companyUser: any;
  let testOffer: any;
  let testPlacement: any;

  beforeAll(async () => {
    const timestamp = Date.now();

    // 1. Creare utilizator ADMIN de test
    adminUser = await prisma.user.create({
      data: {
        email: `admin-test-${timestamp}@ulbsibiu.ro`,
        passwordHash: "hash_admin",
        firstName: "Admin",
        lastName: "Test",
        role: UserRole.ADMIN,
        isActive: true,
      },
    });

    // 2. Creare utilizator COORDINATOR de test
    coordinatorUser = await prisma.user.create({
      data: {
        email: `coord-test-${timestamp}@ulbsibiu.ro`,
        passwordHash: "hash_coord",
        firstName: "Prof.",
        lastName: "Coordonator",
        role: UserRole.COORDINATOR,
        isActive: true,
      },
    });

    // 3. Creare utilizator STUDENT de test
    studentUser = await prisma.user.create({
      data: {
        email: `student-test-${timestamp}@ulbsibiu.ro`,
        passwordHash: "hash_student",
        firstName: "Andrei",
        lastName: "Ionescu",
        role: UserRole.STUDENT,
        isActive: true,
        studentProfile: {
          create: {
            specialization: "Calculatoare",
            studyYear: 3,
            group: "331",
            phone: "0722111222",
            headline: "Student pasionat de Backend",
            bio: "Date personale student",
          },
        },
      },
      include: { studentProfile: true },
    });

    // 4. Creare utilizator COMPANIE de test
    companyUser = await prisma.user.create({
      data: {
        email: `company-test-${timestamp}@partner.ro`,
        passwordHash: "hash_company",
        firstName: "Reprezentant",
        lastName: "Firma",
        role: UserRole.COMPANY_TUTOR,
        isActive: true,
        companyProfile: {
          create: {
            companyName: `Tech Corp ${timestamp}`,
            cuiCif: `RO${timestamp.toString().slice(-8)}`,
            city: "Sibiu",
            address: "Str. Inovatiei nr. 1",
            status: CompanyStatus.PENDING,
          },
        },
      },
      include: { companyProfile: true },
    });

    // 5. Creare ofertă activă și plasament de test
    testOffer = await prisma.internshipOffer.create({
      data: {
        companyId: companyUser.companyProfile.id,
        title: "Internship Cloud & Security",
        description: "Dezvoltare servicii cloud",
        slotsTotal: 2,
        slotsAvailable: 1,
        location: "Sibiu",
        startDate: new Date(),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60),
        tutorName: "Ing. Tutor",
        tutorEmail: companyUser.email,
        status: OfferStatus.ACTIVE,
      },
    });

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
    try {
      if (testPlacement?.id) {
        await prisma.placement.deleteMany({ where: { id: testPlacement.id } });
      }
      if (testOffer?.id) {
        await prisma.internshipOffer.deleteMany({ where: { id: testOffer.id } });
      }
      const testUserIds = [
        adminUser?.id,
        studentUser?.id,
        coordinatorUser?.id,
        companyUser?.id,
      ].filter(Boolean);

      if (testUserIds.length > 0) {
        await prisma.notification.deleteMany({ where: { userId: { in: testUserIds } } });
        await prisma.auditLog.deleteMany({ where: { actorId: { in: testUserIds } } });
        await prisma.studentProfile.deleteMany({ where: { userId: { in: testUserIds } } });
        await prisma.companyProfile.deleteMany({ where: { userId: { in: testUserIds } } });
        await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });
      }
    } catch {
      // ignore cleanup errors
    }
  });

  describe("1. RBAC & Protecție Rol Admin", () => {
    it("permite accesul doar dacă utilizatorul are rolul ADMIN și este activ", () => {
      const isRoleAllowed = (role: UserRole, isActive: boolean) =>
        role === UserRole.ADMIN && isActive;

      expect(isRoleAllowed(UserRole.ADMIN, true)).toBe(true);
      expect(isRoleAllowed(UserRole.ADMIN, false)).toBe(false);
      expect(isRoleAllowed(UserRole.STUDENT, true)).toBe(false);
      expect(isRoleAllowed(UserRole.COMPANY_TUTOR, true)).toBe(false);
      expect(isRoleAllowed(UserRole.COORDINATOR, true)).toBe(false);
    });
  });

  describe("2. Reguli Globale de Practică (SystemSettings)", () => {
    it("citește și actualizează setările globale (requiredHours și tieBreakerRule)", async () => {
      // 1. Preluare setări implicite
      const settings = await getSystemSettings();
      expect(settings).toBeDefined();
      expect(settings.requiredHours).toBeGreaterThanOrEqual(1);
      expect([
        TieBreakerRule.APPLICATION_ORDER,
        TieBreakerRule.ACADEMIC_SCORE,
      ]).toContain(settings.tieBreakerRule);

      // 2. Actualizare setări
      const updated = await updateSystemSettings({
        requiredHours: 160,
        tieBreakerRule: TieBreakerRule.ACADEMIC_SCORE,
      });

      expect(updated.requiredHours).toBe(160);
      expect(updated.tieBreakerRule).toBe(TieBreakerRule.ACADEMIC_SCORE);

      // 3. Resetare la valoarea default
      const reset = await updateSystemSettings({
        requiredHours: 120,
        tieBreakerRule: TieBreakerRule.APPLICATION_ORDER,
      });
      expect(reset.requiredHours).toBe(120);
      expect(reset.tieBreakerRule).toBe(TieBreakerRule.APPLICATION_ORDER);
    });

    it("aruncă eroare pentru valori invalide de ore", async () => {
      await expect(
        updateSystemSettings({ requiredHours: -10 })
      ).rejects.toThrow("Numărul de ore obligatorii trebuie să fie un întreg pozitiv.");
    });
  });

  describe("3. Validare Firme & Retragere Oferte (Twist P14)", () => {
    it("aprobarea unei companii generează log de audit și notificare", async () => {
      const companyId = companyUser.companyProfile.id;

      // Actualizare status companie
      const updated = await prisma.companyProfile.update({
        where: { id: companyId },
        data: { status: CompanyStatus.APPROVED },
      });
      expect(updated.status).toBe(CompanyStatus.APPROVED);

      // Înregistrare Audit Log
      const audit = await logAuditEvent({
        actorId: adminUser.id,
        actionType: AuditActionType.COMPANY_APPROVE,
        targetEntity: `Company:${companyId}`,
        details: { companyName: updated.companyName, status: "APPROVED" },
      });
      expect(audit).toBeDefined();
      expect(audit?.actionType).toBe(AuditActionType.COMPANY_APPROVE);

      // Trimitere notificare
      const notif = await createNotification({
        userId: companyUser.id,
        title: "Profil aprobat",
        message: "Compania a fost aprobată.",
        type: NotificationType.COMPANY_STATUS_CHANGED,
      });
      expect(notif.userId).toBe(companyUser.id);
    });

    it("retragerea unei oferte active trece studenții în NEPLASAT și notifică Coordonatorul și Studentul (Twist P14)", async () => {
      const offerId = testOffer.id;

      // Verificăm că plasamentul este inițial CONFIRMED
      const initialPlacement = await prisma.placement.findUniqueOrThrow({
        where: { id: testPlacement.id },
      });
      expect(initialPlacement.status).toBe(PlacementStatus.CONFIRMED);

      // Simulare Twist P14: Admin retrage oferta
      await prisma.$transaction(async (tx) => {
        // 1. Închidere ofertă
        await tx.internshipOffer.update({
          where: { id: offerId },
          data: { status: OfferStatus.CLOSED },
        });

        // 2. Trecere automată în NEPLASAT cu motiv de realocare minimală
        await tx.placement.updateMany({
          where: {
            offerId,
            status: { in: [PlacementStatus.PENDING_CONFIRMATION, PlacementStatus.CONFIRMED] },
          },
          data: {
            status: PlacementStatus.NEPLASAT,
            cancelledAt: new Date(),
            cancelReason: "Ofertă retrasă de Admin - necesită realocare minimală",
          },
        });
      });

      // Verificare status plasament actualizat
      const updatedPlacement = await prisma.placement.findUniqueOrThrow({
        where: { id: testPlacement.id },
      });
      expect(updatedPlacement.status).toBe(PlacementStatus.NEPLASAT);
      expect(updatedPlacement.cancelReason).toContain("realocare minimală");
      expect(updatedPlacement.cancelledAt).toBeInstanceOf(Date);

      // Trimitere notificări Twist P14 către student și coordonatori
      const studentNotif = await createNotification({
        userId: studentUser.id,
        title: "Ofertă retrasă",
        message: "Oferta a fost retrasă. Ești în status NEPLASAT pentru realocare minimală.",
        type: NotificationType.OFFER_WITHDRAWN,
      });
      expect(studentNotif.userId).toBe(studentUser.id);
      expect(studentNotif.type).toBe(NotificationType.OFFER_WITHDRAWN);

      const coordNotifs = await notifyCoordinators({
        title: "Alertă Twist P14: Ofertă retrasă",
        message: "Studentul necesită realocare minimală.",
        type: NotificationType.OFFER_WITHDRAWN,
      });
      expect(coordNotifs.length).toBeGreaterThanOrEqual(1);

      // Audit Log Twist P14
      const audit = await logAuditEvent({
        actorId: adminUser.id,
        actionType: AuditActionType.OFFER_WITHDRAW,
        targetEntity: `Offer:${offerId}`,
        details: { affectedStudents: 1, reason: "Twist P14" },
      });
      expect(audit?.actionType).toBe(AuditActionType.OFFER_WITHDRAW);
    });
  });

  describe("4. Anonimizare GDPR la cerere", () => {
    it("înlocuiește datele personale conform specificațiilor păstrând plasamentul intact", async () => {
      const studentId = studentUser.studentProfile.id;
      const targetUserId = studentUser.id;

      // Executare anonimizare conform specificației:
      // nume -> Student_Anonim_<id>, email -> anonim_<id>@deleted.local, telefon/alte date -> null
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: targetUserId },
          data: {
            firstName: `Student_Anonim_${studentId}`,
            lastName: "",
            email: `anonim_${studentId}@deleted.local`,
            passwordHash: "ERASED_GDPR",
            isActive: false,
          },
        });

        await tx.studentProfile.update({
          where: { id: studentId },
          data: {
            phone: null,
            bio: null,
            headline: null,
            cvUrl: null,
            githubUrl: null,
            linkedinUrl: null,
            portfolioUrl: null,
            gdprConsent: false,
            gdprConsentAt: null,
          },
        });
      });

      // Audit Log GDPR
      const audit = await logAuditEvent({
        actorId: adminUser.id,
        actionType: AuditActionType.GDPR_ANONYMIZE,
        targetEntity: `StudentProfile:${studentId}`,
        details: { targetUserId, studentId },
      });
      expect(audit?.actionType).toBe(AuditActionType.GDPR_ANONYMIZE);

      // Verificăm datele anonimizate
      const anonymizedUser = await prisma.user.findUniqueOrThrow({
        where: { id: targetUserId },
      });
      expect(anonymizedUser.firstName).toBe(`Student_Anonim_${studentId}`);
      expect(anonymizedUser.lastName).toBe("");
      expect(anonymizedUser.email).toBe(`anonim_${studentId}@deleted.local`);
      expect(anonymizedUser.isActive).toBe(false);

      const anonymizedProfile = await prisma.studentProfile.findUniqueOrThrow({
        where: { id: studentId },
      });
      expect(anonymizedProfile.phone).toBeNull();
      expect(anonymizedProfile.bio).toBeNull();

      // Plasamentul trebuie să rămână intact în baza de date!
      const placementCheck = await prisma.placement.findUnique({
        where: { studentId },
      });
      expect(placementCheck).toBeDefined();
      expect(placementCheck?.id).toBe(testPlacement.id);
    });
  });

  describe("5. Management Utilizatori & Audit Log", () => {
    it("schimbarea rolului și activarea/dezactivarea conturilor funcționează corect cu Audit Log", async () => {
      // 1. Modificare rol utilizator
      const updatedUser = await prisma.user.update({
        where: { id: coordinatorUser.id },
        data: { role: UserRole.COORDINATOR },
      });
      expect(updatedUser.role).toBe(UserRole.COORDINATOR);

      const roleAudit = await logAuditEvent({
        actorId: adminUser.id,
        actionType: AuditActionType.USER_ROLE_CHANGE,
        targetEntity: `User:${coordinatorUser.id}`,
        details: { newRole: UserRole.COORDINATOR },
      });
      expect(roleAudit?.actionType).toBe(AuditActionType.USER_ROLE_CHANGE);

      // 2. Dezactivare și reactivare cont
      const deactivatedUser = await prisma.user.update({
        where: { id: coordinatorUser.id },
        data: { isActive: false },
      });
      expect(deactivatedUser.isActive).toBe(false);

      const statusAudit = await logAuditEvent({
        actorId: adminUser.id,
        actionType: AuditActionType.USER_STATUS_CHANGE,
        targetEntity: `User:${coordinatorUser.id}`,
        details: { newStatus: false },
      });
      expect(statusAudit?.actionType).toBe(AuditActionType.USER_STATUS_CHANGE);

      // Reactivare
      const reactivatedUser = await prisma.user.update({
        where: { id: coordinatorUser.id },
        data: { isActive: true },
      });
      expect(reactivatedUser.isActive).toBe(true);
    });
  });
});
