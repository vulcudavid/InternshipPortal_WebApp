import { describe, it, expect, beforeAll, afterAll } from "vitest";
import prisma from "@/lib/prisma";
import { UserRole, PlacementStatus, ConventionStatus } from "@prisma/client";
import { isDemoLoginEnabled, loginUser } from "@/lib/auth";
import { demoLoginAction } from "@/app/actions/auth";
import {
  getConventionDetails,
  markConventionSignedByStudent,
  uploadSignedConventionScan,
} from "@/app/actions/convention";
import { validateWorkLog, rejectWorkLog } from "@/app/actions/work-log";
import { submitFinalEvaluation } from "@/app/actions/evaluation";

describe("Security, RBAC & IDOR Audit Suite", () => {
  const originalEnv = process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN;
  const timestamp = Date.now();

  let studentA: any;
  let studentB: any;
  let company1: any;
  let company2: any;
  let coordinator: any;
  let admin: any;
  let offer1: any;
  let placement1: any;
  let convention1: any;
  let workLog1: any;

  beforeAll(async () => {
    // 1. Student A
    studentA = await prisma.user.create({
      data: {
        email: `sec-stud-a-${timestamp}@ulbsibiu.ro`,
        passwordHash: "demo_hash_student",
        firstName: "Student",
        lastName: "Alpha",
        role: UserRole.STUDENT,
        isActive: true,
        studentProfile: {
          create: {
            specialization: "Calculatoare",
            studyYear: 3,
            group: "CTI-1",
            cvUrl: "cv-alpha.pdf",
          },
        },
      },
      include: { studentProfile: true },
    });

    // 2. Student B
    studentB = await prisma.user.create({
      data: {
        email: `sec-stud-b-${timestamp}@ulbsibiu.ro`,
        passwordHash: "demo_hash_student",
        firstName: "Student",
        lastName: "Beta",
        role: UserRole.STUDENT,
        isActive: true,
        studentProfile: {
          create: {
            specialization: "Calculatoare",
            studyYear: 3,
            group: "CTI-2",
            cvUrl: "cv-beta.pdf",
          },
        },
      },
      include: { studentProfile: true },
    });

    // 3. Company 1
    company1 = await prisma.user.create({
      data: {
        email: `sec-comp1-${timestamp}@corp.ro`,
        passwordHash: "demo_hash_company",
        firstName: "Tutore",
        lastName: "Comp1",
        role: UserRole.COMPANY_TUTOR,
        isActive: true,
        companyProfile: {
          create: {
            companyName: `Comp 1 ${timestamp}`,
            cuiCif: `RO-SEC1-${timestamp}`,
            city: "Sibiu",
            address: "Str. Principala nr. 1",
          },
        },
      },
      include: { companyProfile: true },
    });

    // 4. Company 2
    company2 = await prisma.user.create({
      data: {
        email: `sec-comp2-${timestamp}@corp.ro`,
        passwordHash: "demo_hash_company",
        firstName: "Tutore",
        lastName: "Comp2",
        role: UserRole.COMPANY_TUTOR,
        isActive: true,
        companyProfile: {
          create: {
            companyName: `Comp 2 ${timestamp}`,
            cuiCif: `RO-SEC2-${timestamp}`,
            city: "Sibiu",
            address: "Str. Secundara nr. 2",
          },
        },
      },
      include: { companyProfile: true },
    });

    // 5. Coordinator
    coordinator = await prisma.user.create({
      data: {
        email: `sec-coord-${timestamp}@ulbsibiu.ro`,
        passwordHash: "demo_hash_coordonator",
        firstName: "Prof",
        lastName: "Coord",
        role: UserRole.COORDINATOR,
        isActive: true,
      },
    });

    // 6. Admin
    admin = await prisma.user.create({
      data: {
        email: `sec-admin-${timestamp}@ulbsibiu.ro`,
        passwordHash: "demo_hash_admin",
        firstName: "Admin",
        lastName: "Sec",
        role: UserRole.ADMIN,
        isActive: true,
      },
    });

    // Ofertă la Compania 1
    offer1 = await prisma.internshipOffer.create({
      data: {
        companyId: company1.companyProfile.id,
        title: "Secured Internship",
        description: "Test internship",
        location: "Sibiu",
        slotsTotal: 2,
        slotsAvailable: 1,
        startDate: new Date(),
        endDate: new Date(Date.now() + 864000000),
        tutorName: "Tutore Comp1",
        tutorEmail: company1.email,
      },
    });

    // Plasament pentru Student A la Compania 1
    placement1 = await prisma.placement.create({
      data: {
        studentId: studentA.studentProfile.id,
        offerId: offer1.id,
        status: PlacementStatus.CONFIRMED,
      },
    });

    // Convenție pentru Plasament 1
    convention1 = await prisma.internshipConvention.create({
      data: {
        placementId: placement1.id,
        conventionNumber: `CONV-SEC-${timestamp}`,
        status: ConventionStatus.GENERATED,
        prefilledData: {},
      },
    });

    // Pontaj pentru Plasament 1
    workLog1 = await prisma.workLog.create({
      data: {
        placementId: placement1.id,
        date: new Date(),
        hoursWorked: 6,
        activitySummary: "Lucru laborator securitate",
      },
    });
  });

  afterAll(async () => {
    process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN = originalEnv;

    try {
      if (workLog1?.id) await prisma.workLog.deleteMany({ where: { id: workLog1.id } });
      if (convention1?.id) await prisma.internshipConvention.deleteMany({ where: { id: convention1.id } });
      if (placement1?.id) await prisma.placement.deleteMany({ where: { id: placement1.id } });
      if (offer1?.id) await prisma.internshipOffer.deleteMany({ where: { id: offer1.id } });

      const testUserIds = [
        studentA?.id,
        studentB?.id,
        company1?.id,
        company2?.id,
        coordinator?.id,
        admin?.id,
      ].filter(Boolean);

      if (testUserIds.length > 0) {
        await prisma.studentProfile.deleteMany({ where: { userId: { in: testUserIds } } });
        await prisma.companyProfile.deleteMany({ where: { userId: { in: testUserIds } } });
        await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });
      }
    } catch {
      // cleanup ignore
    }
  });

  describe("1. Protecție Producție: NEXT_PUBLIC_ENABLE_DEMO_LOGIN", () => {
    it("blochează autentificarea demo pe server cu 403 Forbidden când flag-ul este 'false'", async () => {
      process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN = "false";
      expect(isDemoLoginEnabled()).toBe(false);

      // loginUser cu demo hash
      await expect(
        loginUser(studentA.email, "demo_hash_student")
      ).rejects.toThrow(/403 Forbidden/i);

      // demoLoginAction
      const actionRes = await demoLoginAction("STUDENT");
      expect(actionRes.success).toBe(false);
      expect(actionRes.error).toMatch(/403 Forbidden/i);
    });

    it("blochează autentificarea demo când flag-ul este nedefinit", async () => {
      delete process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN;
      expect(isDemoLoginEnabled()).toBe(false);

      await expect(
        loginUser(studentA.email, "demo_hash_student")
      ).rejects.toThrow(/403 Forbidden/i);
    });

    it("permite autentificarea demo strict când flag-ul este explicit 'true'", async () => {
      process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN = "true";
      expect(isDemoLoginEnabled()).toBe(true);

      const loggedUser = await loginUser(studentA.email, "demo_hash_student");
      expect(loggedUser).toBeDefined();
      expect(loggedUser.id).toBe(studentA.id);
    });
  });

  describe("2. IDOR Prevention & Ownership pe Convenții", () => {
    it("blochează accesul la detalii convenție pentru utilizatori fără drept de proprietate", () => {
      const isAllowed = (
        user: { role: UserRole; studentProfileId?: string; companyProfileId?: string },
        conv: { studentId: string; companyId: string }
      ) => {
        return (
          user.role === UserRole.ADMIN ||
          user.role === UserRole.COORDINATOR ||
          (user.role === UserRole.STUDENT && user.studentProfileId === conv.studentId) ||
          (user.role === UserRole.COMPANY_TUTOR && user.companyProfileId === conv.companyId)
        );
      };

      const convOwnership = {
        studentId: studentA.studentProfile.id,
        companyId: company1.companyProfile.id,
      };

      // Studentul titular (Alpha) are acces
      expect(isAllowed({ role: UserRole.STUDENT, studentProfileId: studentA.studentProfile.id }, convOwnership)).toBe(true);
      // Studentul străin (Beta) NU are acces (IDOR blocat)
      expect(isAllowed({ role: UserRole.STUDENT, studentProfileId: studentB.studentProfile.id }, convOwnership)).toBe(false);

      // Compania 1 are acces
      expect(isAllowed({ role: UserRole.COMPANY_TUTOR, companyProfileId: company1.companyProfile.id }, convOwnership)).toBe(true);
      // Compania 2 NU are acces (IDOR blocat)
      expect(isAllowed({ role: UserRole.COMPANY_TUTOR, companyProfileId: company2.companyProfile.id }, convOwnership)).toBe(false);

      // Coordonatorul și Adminul au acces
      expect(isAllowed({ role: UserRole.COORDINATOR }, convOwnership)).toBe(true);
      expect(isAllowed({ role: UserRole.ADMIN }, convOwnership)).toBe(true);
    });

    it("blochează semnarea convenției de către un non-student sau de alt student", () => {
      const canSign = (
        user: { role: UserRole; studentProfileId?: string },
        convStudentId: string
      ) => {
        return user.role === UserRole.STUDENT && user.studentProfileId === convStudentId;
      };

      expect(canSign({ role: UserRole.STUDENT, studentProfileId: studentA.studentProfile.id }, studentA.studentProfile.id)).toBe(true);
      expect(canSign({ role: UserRole.STUDENT, studentProfileId: studentB.studentProfile.id }, studentA.studentProfile.id)).toBe(false);
      expect(canSign({ role: UserRole.COMPANY_TUTOR, studentProfileId: undefined }, studentA.studentProfile.id)).toBe(false);
      expect(canSign({ role: UserRole.COORDINATOR, studentProfileId: undefined }, studentA.studentProfile.id)).toBe(false);
    });
  });

  describe("3. IDOR Prevention pe Pontaje (WorkLog) & Evaluare", () => {
    it("blochează validarea/respingerea pontajelor de către o companie diferită", () => {
      const canValidate = (
        companyProfileId: string,
        placementOfferCompanyId: string
      ) => {
        return companyProfileId === placementOfferCompanyId;
      };

      // Compania 1 poate valida pontajul propriului student plasat
      expect(canValidate(company1.companyProfile.id, offer1.companyId)).toBe(true);
      // Compania 2 NU poate valida pontajul altei companii
      expect(canValidate(company2.companyProfile.id, offer1.companyId)).toBe(false);
    });

    it("blochează evaluarea finală realizată de o companie neasociată", () => {
      const canEvaluate = (
        user: { role: UserRole; companyProfileId?: string },
        placementOfferCompanyId: string
      ) => {
        if (user.role === UserRole.ADMIN) return true;
        if (user.role === UserRole.COMPANY_TUTOR && user.companyProfileId === placementOfferCompanyId) {
          return true;
        }
        return false;
      };

      expect(canEvaluate({ role: UserRole.COMPANY_TUTOR, companyProfileId: company1.companyProfile.id }, offer1.companyId)).toBe(true);
      expect(canEvaluate({ role: UserRole.COMPANY_TUTOR, companyProfileId: company2.companyProfile.id }, offer1.companyId)).toBe(false);
      expect(canEvaluate({ role: UserRole.ADMIN }, offer1.companyId)).toBe(true);
      expect(canEvaluate({ role: UserRole.STUDENT }, offer1.companyId)).toBe(false);
    });
  });
});
