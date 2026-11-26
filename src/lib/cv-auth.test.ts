/**
 * Suita de teste de autorizare pentru descărcarea CV-ului
 * Validează codurile de status RBAC: 401, 403, 200
 */
import assert from "assert";
import { describe, it, afterAll } from "vitest";
import prisma from "@/lib/prisma";
import { canCompanyAccessStudentCv } from "@/lib/privacy";
import { UserRole } from "@prisma/client";

/**
 * Funcție pură care reproduce logica de decizie RBAC a endpoint-ului /api/cv/[studentId]
 */
export async function checkCvAccess(
  currentUser: {
    id: string;
    role: UserRole;
    studentProfile?: { id: string } | null;
    companyProfile?: { id: string } | null;
  } | null,
  targetStudentId: string
): Promise<{ status: number; allowed: boolean }> {
  if (!currentUser) {
    return { status: 401, allowed: false };
  }

  if (currentUser.role === UserRole.COORDINATOR || currentUser.role === UserRole.ADMIN) {
    return { status: 200, allowed: true };
  }

  if (currentUser.role === UserRole.STUDENT) {
    if (currentUser.studentProfile?.id === targetStudentId) {
      return { status: 200, allowed: true };
    }
    return { status: 403, allowed: false };
  }

  if (currentUser.role === UserRole.COMPANY_TUTOR) {
    if (!currentUser.companyProfile) {
      return { status: 403, allowed: false };
    }
    const hasAccess = await canCompanyAccessStudentCv(
      currentUser.companyProfile.id,
      targetStudentId
    );
    if (hasAccess) {
      return { status: 200, allowed: true };
    }
    return { status: 403, allowed: false };
  }

  return { status: 403, allowed: false };
}

describe("CV Authorization & Privacy Gate (RBAC)", () => {
  const uniquePrefix = `cvauth-${Date.now()}`;
  let userStudentA: any;
  let userStudentB: any;
  let userCompany1: any;
  let userCompany2: any;
  let userCoordinator: any;
  let studentAProfileId: string;
  let studentBProfileId: string;
  let company1OfferId: string;

  it("pregătește datele de test în DB", async () => {
    // 1. Student A
    userStudentA = await prisma.user.create({
      data: {
        email: `${uniquePrefix}-studentA@test.ulbsibiu.ro`,
        passwordHash: "hash",
        firstName: "Student",
        lastName: "Alfa",
        role: UserRole.STUDENT,
        studentProfile: {
          create: {
            specialization: "Calculatoare",
            studyYear: 3,
            group: "CTI-1",
            phone: "0711111111",
            cvUrl: "cv-student-alfa.pdf",
          },
        },
      },
      include: { studentProfile: true },
    });

    // 2. Student B
    userStudentB = await prisma.user.create({
      data: {
        email: `${uniquePrefix}-studentB@test.ulbsibiu.ro`,
        passwordHash: "hash",
        firstName: "Student",
        lastName: "Beta",
        role: UserRole.STUDENT,
        studentProfile: {
          create: {
            specialization: "Calculatoare",
            studyYear: 3,
            group: "CTI-2",
            phone: "0722222222",
            cvUrl: "cv-student-beta.pdf",
          },
        },
      },
      include: { studentProfile: true },
    });

    // 3. Compania 1 cu o ofertă
    userCompany1 = await prisma.user.create({
      data: {
        email: `${uniquePrefix}-comp1@test.ro`,
        passwordHash: "hash",
        firstName: "Reprezentant",
        lastName: "FirmaUnu",
        role: UserRole.COMPANY_TUTOR,
        companyProfile: {
          create: {
            companyName: "Tech Firm SRL",
            cuiCif: `RO-${Date.now()}`,
            address: "Str. Inovatiei nr. 1",
            city: "Sibiu",
            offers: {
              create: {
                title: "Junior Cloud Engineer",
                description: "Practica cloud",
                location: "Sibiu",
                startDate: new Date("2027-07-05"),
                endDate: new Date("2027-07-25"),
                tutorName: "Ing. Popa",
                tutorEmail: "popa@techfirm.ro",
              },
            },
          },
        },
      },
      include: { companyProfile: { include: { offers: true } } },
    });

    // 4. Compania 2 (fără preferință de la studentul A)
    userCompany2 = await prisma.user.create({
      data: {
        email: `${uniquePrefix}-comp2@test.ro`,
        passwordHash: "hash",
        firstName: "Reprezentant",
        lastName: "FirmaDoi",
        role: UserRole.COMPANY_TUTOR,
        companyProfile: {
          create: {
            companyName: "Other Corp SRL",
            cuiCif: `RO-${Date.now() + 1}`,
            address: "Str. Secundara nr. 2",
            city: "Sibiu",
          },
        },
      },
      include: { companyProfile: true },
    });

    // 5. Coordonator Academic
    userCoordinator = await prisma.user.create({
      data: {
        email: `${uniquePrefix}-coord@ulbsibiu.ro`,
        passwordHash: "hash",
        firstName: "Prof",
        lastName: "Coordonator",
        role: UserRole.COORDINATOR,
      },
    });

    studentAProfileId = userStudentA.studentProfile!.id;
    studentBProfileId = userStudentB.studentProfile!.id;
    company1OfferId = userCompany1.companyProfile!.offers[0].id;

    // Student A aplică la Compania 1
    await prisma.studentPreference.create({
      data: {
        studentId: studentAProfileId,
        offerId: company1OfferId,
        rank: 1,
      },
    });
  });

  it("returnează 401 pentru utilizator neautentificat", async () => {
    const res = await checkCvAccess(null, studentAProfileId);
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.allowed, false);
  });

  it("returnează 200 pentru studentul care își accesează propriul CV", async () => {
    const res = await checkCvAccess(userStudentA, studentAProfileId);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.allowed, true);
  });

  it("returnează 403 pentru un student care încearcă să acceseze CV-ul altui student", async () => {
    const res = await checkCvAccess(userStudentB, studentAProfileId);
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.allowed, false);
  });

  it("returnează 200 pentru compania la a cărei ofertă studentul a aplicat", async () => {
    const res = await checkCvAccess(userCompany1, studentAProfileId);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.allowed, true);
  });

  it("DoD IDOR Guard: returnează 403 Forbidden pentru compania la a cărei ofertă studentul NU a aplicat și nu este plasat", async () => {
    const res = await checkCvAccess(userCompany2, studentAProfileId);
    assert.strictEqual(res.status, 403, "Trebuie să returneze 403 Forbidden la încercare IDOR de către o firmă neautorizată");
    assert.strictEqual(res.allowed, false);
  });

  it("returnează 200 pentru coordonatorul academic", async () => {
    const res = await checkCvAccess(userCoordinator, studentAProfileId);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.allowed, true);
  });

  afterAll(async () => {
    if (userStudentA?.id) {
      await prisma.user.deleteMany({
        where: {
          id: {
            in: [
              userStudentA.id,
              userStudentB.id,
              userCompany1.id,
              userCompany2.id,
              userCoordinator.id,
            ],
          },
        },
      });
    }
  });
});
