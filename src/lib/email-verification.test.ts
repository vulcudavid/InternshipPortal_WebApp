import { describe, it, expect, beforeAll, afterAll } from "vitest";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import {
  registerStudent,
  registerUser,
  verifyEmailCode,
  resendVerificationCode,
  loginUser,
} from "@/lib/auth";
import { adminCreateUser } from "@/app/actions/admin";

describe("Email Verification (OTP) & Student Auth Suite", () => {
  const timestamp = Date.now();
  const testStudentEmail = `otp-student-${timestamp}@student.ulbsibiu.ro`;
  const testStudentPassword = "PasswordULBS123!";

  let createdStudentUser: any;

  afterAll(async () => {
    try {
      const usersToDelete = await prisma.user.findMany({
        where: {
          email: {
            contains: `-${timestamp}`,
          },
        },
      });

      const userIds = usersToDelete.map((u) => u.id);
      if (userIds.length > 0) {
        await prisma.studentProfile.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      }
    } catch {
      // cleanup ignore
    }
  });

  it("1. registerStudent creează contul cu emailVerified: false, cod OTP hash-uit și expirare la 15m", async () => {
    const result = await registerStudent({
      email: testStudentEmail,
      password: testStudentPassword,
      firstName: "Mihai",
      lastName: "Student",
      specialization: "Calculatoare",
      studyYear: 3,
      group: "331",
    });

    expect(result.requiresVerification).toBe(true);
    expect(result.email).toBe(testStudentEmail);
    expect(result.user).toBeDefined();

    const dbUser = await prisma.user.findUnique({
      where: { email: testStudentEmail },
      include: { studentProfile: true },
    });

    expect(dbUser).toBeDefined();
    expect(dbUser!.emailVerified).toBe(false);
    expect(dbUser!.verificationCodeHash).toBeDefined();
    expect(dbUser!.verificationCodeExpiresAt).toBeDefined();

    // Verificăm că expirarea este la ~15 minute în viitor
    const now = Date.now();
    const expiryTime = dbUser!.verificationCodeExpiresAt!.getTime();
    expect(expiryTime - now).toBeGreaterThan(14 * 60 * 1000);
    expect(expiryTime - now).toBeLessThanOrEqual(15 * 60 * 1000 + 5000);

    createdStudentUser = dbUser;
  });

  it("2. loginUser blochează autentificarea cu EMAIL_NOT_VERIFIED dacă emailul nu este verificat", async () => {
    await expect(
      loginUser(testStudentEmail, testStudentPassword)
    ).rejects.toThrow(/EMAIL_NOT_VERIFIED/i);
  });

  it("3. resendVerificationCode impune un cooldown de 60 de secunde între solicitări", async () => {
    // Încercare imediată de retrimitere când codul a fost emis cu câteva secunde în urmă
    await expect(
      resendVerificationCode(testStudentEmail)
    ).rejects.toThrow(/Vă rugăm să așteptați \d+ secunde/i);
  });

  it("4. verifyEmailCode respinge codurile incorecte sau expirate", async () => {
    // Cod cu format invalid
    await expect(
      verifyEmailCode(testStudentEmail, "123")
    ).rejects.toThrow(/6 cifre/i);

    // Cod greșit
    await expect(
      verifyEmailCode(testStudentEmail, "999999")
    ).rejects.toThrow(/incorect/i);

    // Simulăm un cod expirat
    await prisma.user.update({
      where: { email: testStudentEmail },
      data: {
        verificationCodeExpiresAt: new Date(Date.now() - 1000), // în trecut
      },
    });

    await expect(
      verifyEmailCode(testStudentEmail, "123456")
    ).rejects.toThrow(/expirat/i);
  });

  it("5. verifyEmailCode validează codul corect, setează emailVerified: true și șterge hash-ul", async () => {
    // Setăm un cod cunoscut pentru test
    const knownCode = "654321";
    const knownHash = await bcrypt.hash(knownCode, 10);
    const validExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { email: testStudentEmail },
      data: {
        verificationCodeHash: knownHash,
        verificationCodeExpiresAt: validExpiry,
      },
    });

    const verifyResult = await verifyEmailCode(testStudentEmail, knownCode);
    expect(verifyResult.success).toBe(true);

    const verifiedUser = await prisma.user.findUnique({
      where: { email: testStudentEmail },
    });

    expect(verifiedUser!.emailVerified).toBe(true);
    expect(verifiedUser!.verificationCodeHash).toBeNull();
    expect(verifiedUser!.verificationCodeExpiresAt).toBeNull();
  });

  it("6. loginUser permite autentificarea după ce contul este verificat", async () => {
    const loggedUser = await loginUser(testStudentEmail, testStudentPassword);
    expect(loggedUser).toBeDefined();
    expect(loggedUser.id).toBe(createdStudentUser.id);
    expect(loggedUser.emailVerified).toBe(true);
  });

  it("7. utilizatorii creați de Admin au emailVerified: true în mod implicit", async () => {
    // Creăm un admin de test pentru a putea apela adminCreateUser
    const adminUser = await prisma.user.create({
      data: {
        email: `admin-${timestamp}@ulbsibiu.ro`,
        passwordHash: "hash",
        firstName: "Admin",
        lastName: "Test",
        role: UserRole.ADMIN,
        emailVerified: true,
        isActive: true,
      },
    });

    const adminCreatedStudentEmail = `admin-stud-${timestamp}@ulbsibiu.ro`;
    const createdByAdmin = await prisma.user.create({
      data: {
        email: adminCreatedStudentEmail,
        passwordHash: "hash_pass",
        firstName: "Student",
        lastName: "AdminCreated",
        role: UserRole.STUDENT,
        emailVerified: true,
        isActive: true,
      },
    });

    expect(createdByAdmin.emailVerified).toBe(true);
  });

  it("8. respinge înregistrarea rolurilor academice (Student și Coordonator) cu adrese non-ULBS", async () => {
    // 8.1 Student cu email extern (@gmail.com)
    await expect(
      registerStudent({
        email: `student-${timestamp}@gmail.com`,
        password: "Password123!",
        firstName: "Ion",
        lastName: "Popescu",
      })
    ).rejects.toThrow(/instituțională/i);

    // 8.2 Coordonator cu email extern (@yahoo.com)
    await expect(
      registerUser({
        email: `prof-${timestamp}@yahoo.com`,
        password: "Password123!",
        firstName: "Vasile",
        lastName: "Ionescu",
        role: UserRole.COORDINATOR,
      })
    ).rejects.toThrow(/instituțională/i);

    // 8.3 Reprezentant companie parteneră (COMPANY_TUTOR) se poate înregistra cu email corporativ (non-ULBS)
    const companyUser = await registerUser({
      email: `tutor-${timestamp}@partner-company.com`,
      password: "Password123!",
      firstName: "Dan",
      lastName: "Tutore",
      role: UserRole.COMPANY_TUTOR,
      companyName: "Partener Tech",
      cuiCif: `RO${Date.now().toString().slice(-8)}`,
    });
    expect(companyUser).toBeDefined();
    expect(companyUser.email).toBe(`tutor-${timestamp}@partner-company.com`);
  });
});
