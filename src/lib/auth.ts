import crypto from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { sendVerificationCodeEmail } from "@/lib/mailer";
import { UserRole, EngineeringDomain } from "@prisma/client";

const SESSION_COOKIE_NAME = "web2_session_user_id";

/**
 * Hash securizat folosind scrypt din modulul nativ Node.js crypto
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const [salt, key] = combinedHash.split(":");
    if (!salt || !key) return false;
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(Buffer.from(key, "hex"), derivedKey);
  } catch {
    return false;
  }
}

/**
 * Înregistrare student cu verificare obligatorie prin cod OTP din 6 cifre (@ulbsibiu.ro)
 */
export async function registerStudent(params: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  specialization?: string;
  studyYear?: number;
  group?: string;
  domain?: EngineeringDomain;
}) {
  const email = params.email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("Un cont cu această adresă de email există deja.");
  }

  const passwordHash = hashPassword(params.password);

  // Generare cod numeric aleatoriu din 6 cifre
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const verificationCodeHash = await bcrypt.hash(code, 10);
  const verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minute

  const newUser = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: params.firstName.trim(),
      lastName: params.lastName.trim(),
      role: UserRole.STUDENT,
      emailVerified: false,
      verificationCodeHash,
      verificationCodeExpiresAt,
      isActive: true,
    },
  });

  await prisma.studentProfile.create({
    data: {
      userId: newUser.id,
      faculty: "Facultatea de Inginerie ULBS",
      specialization: params.specialization || "Calculatoare",
      studyYear: Number(params.studyYear) || 3,
      group: params.group || "Grupa 331",
      domain: params.domain || EngineeringDomain.COMPUTER_SCIENCE_IT,
      headline: `Student la ${params.specialization || "Inginerie"}`,
    },
  });

  // Trimitere email cu codul OTP (fără sesiune de login)
  await sendVerificationCodeEmail(
    newUser.email,
    `${newUser.firstName} ${newUser.lastName}`,
    code
  );

  return {
    requiresVerification: true,
    email: newUser.email,
    user: newUser,
  };
}

/**
 * Înregistrare utilizator nou cu crearea profilului asociat rolului
 */
export async function registerUser(params: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  // Date specifice Student
  specialization?: string;
  studyYear?: number;
  group?: string;
  domain?: EngineeringDomain;
  // Date specifice Companie
  companyName?: string;
  cuiCif?: string;
  city?: string;
  address?: string;
}) {
  // Dacă rolul este STUDENT, aplicăm fluxul obligatoriu cu verificare email prin OTP
  if (params.role === UserRole.STUDENT) {
    return registerStudent({
      email: params.email,
      password: params.password,
      firstName: params.firstName,
      lastName: params.lastName,
      specialization: params.specialization,
      studyYear: params.studyYear,
      group: params.group,
      domain: params.domain,
    });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: params.email.toLowerCase().trim() },
  });

  if (existingUser) {
    throw new Error("Un cont cu această adresă de email există deja.");
  }

  const passwordHash = hashPassword(params.password);

  const newUser = await prisma.user.create({
    data: {
      email: params.email.toLowerCase().trim(),
      passwordHash,
      firstName: params.firstName.trim(),
      lastName: params.lastName.trim(),
      role: params.role,
      emailVerified: true, // Companiile partenere sunt pre-activate (sau aprobate de admin)
      isActive: true,
    },
  });

  if (params.role === UserRole.COMPANY_TUTOR) {
    await prisma.companyProfile.create({
      data: {
        userId: newUser.id,
        companyName: params.companyName || "Companie Parteneră",
        cuiCif: params.cuiCif || `RO${Date.now().toString().slice(-8)}`,
        city: params.city || "Sibiu",
        address: params.address || "Str. Principală",
      },
    });
  }

  // Setare sesiune în cookie pentru conturile verificate direct
  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, newUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 zile
    });
  } catch {
    // ignoră în context de test/scripturi
  }

  return {
    requiresVerification: false,
    email: newUser.email,
    user: newUser,
  };
}

/**
 * Validare cod numeric de verificare din 6 cifre trimis pe email
 */
export async function verifyEmailCode(email: string, code: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const cleanCode = code.trim();

  if (!cleanCode || cleanCode.length !== 6) {
    throw new Error("Codul de verificare trebuie să conțină exact 6 cifre.");
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      studentProfile: true,
      companyProfile: true,
    },
  });

  if (!user) {
    throw new Error("Utilizatorul specificat nu a fost găsit.");
  }

  if (user.emailVerified) {
    return {
      success: true,
      message: "Adresa de email este deja verificată.",
      alreadyVerified: true,
      user,
    };
  }

  if (!user.verificationCodeHash || !user.verificationCodeExpiresAt) {
    throw new Error("Nu există niciun cod de verificare activ pentru acest cont.");
  }

  if (new Date() > user.verificationCodeExpiresAt) {
    throw new Error("Codul de verificare a expirat. Vă rugăm să solicitați un cod nou.");
  }

  const isMatch = await bcrypt.compare(cleanCode, user.verificationCodeHash);
  if (!isMatch) {
    throw new Error("Codul de verificare introdus este incorect.");
  }

  // Marcare email ca verificat și ștergere hash OTP
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationCodeHash: null,
      verificationCodeExpiresAt: null,
    },
    include: {
      studentProfile: true,
      companyProfile: true,
    },
  });

  // Setare sesiune cookie
  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, updatedUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  } catch {
    // ignoră în context de test
  }

  return {
    success: true,
    message: "Adresa de email a fost verificată cu succes!",
    user: updatedUser,
  };
}

/**
 * Retrimitere cod OTP pe email cu cooldown strict de 60 de secunde
 */
export async function resendVerificationCode(email: string) {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new Error("Utilizatorul specificat nu a fost găsit.");
  }

  if (user.emailVerified) {
    return {
      success: true,
      message: "Adresa de email este deja verificată.",
      alreadyVerified: true,
    };
  }

  // Verificare cooldown de 60 de secunde
  if (user.verificationCodeExpiresAt) {
    const msUntilExpiry = user.verificationCodeExpiresAt.getTime() - Date.now();
    const cooldownThresholdMs = 14 * 60 * 1000; // Mai mult de 14 minute rămase înseamnă sub 60s scurse

    if (msUntilExpiry > cooldownThresholdMs) {
      const waitSeconds = Math.ceil((msUntilExpiry - cooldownThresholdMs) / 1000);
      const error = new Error(`Vă rugăm să așteptați ${waitSeconds} secunde înainte de a solicita un nou cod.`);
      (error as any).code = "RESEND_COOLDOWN";
      throw error;
    }
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const verificationCodeHash = await bcrypt.hash(code, 10);
  const verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationCodeHash,
      verificationCodeExpiresAt,
    },
  });

  await sendVerificationCodeEmail(
    user.email,
    `${user.firstName} ${user.lastName}`,
    code
  );

  return {
    success: true,
    message: "Un nou cod de verificare a fost trimis pe adresa de email.",
  };
}

/**
 * Verifică dacă autentificarea demonstrativă (1-click demo login) este activată
 */
export function isDemoLoginEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true";
}

/**
 * Autentificare utilizator
 */
export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: {
      studentProfile: true,
      companyProfile: true,
    },
  });

  if (!user) {
    throw new Error("Date de autentificare incorecte (email sau parolă greșită).");
  }

  // Blocare autentificare dacă emailul nu a fost verificat (EMAIL_NOT_VERIFIED)
  if (user.emailVerified === false) {
    const error = new Error("EMAIL_NOT_VERIFIED: Adresa de email nu a fost verificată. Vă rugăm să introduceți codul de 6 cifre primit pe email.");
    (error as any).code = "EMAIL_NOT_VERIFIED";
    throw error;
  }

  // Protecție Producție: blocare încercări demo login dacă flag-ul nu este "true"
  const isDemoAccountOrPass =
    user.passwordHash.startsWith("demo_") || password.startsWith("demo_");

  if (isDemoAccountOrPass && !isDemoLoginEnabled()) {
    throw new Error("403 Forbidden: Autentificarea demo este blocată pe server în acest mediu.");
  }

  // Verificare hash parolă (suportă atât scrypt, cât și demo hashes)
  const isMatch =
    user.passwordHash.includes(":") 
      ? verifyPassword(password, user.passwordHash)
      : user.passwordHash === password || user.passwordHash.startsWith("demo_");

  if (!isMatch) {
    throw new Error("Date de autentificare incorecte (email sau parolă greșită).");
  }

  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  } catch {
    // ignoră în context de test/scripturi
  }

  return user;
}

/**
 * Deconectare utilizator
 */
export async function logoutUser() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch {
    // ignoră în context de test
  }
}

/**
 * Obține utilizatorul curent din sesiune
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: {
          include: {
            tags: {
              include: { tag: true },
            },
          },
        },
        companyProfile: {
          include: {
            offers: true,
          },
        },
      },
    });

    if (!user || !user.isActive) return null;

    return user;
  } catch {
    return null;
  }
}
