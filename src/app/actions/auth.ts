"use server";

import { revalidatePath } from "next/cache";
import {
  loginUser,
  registerUser,
  registerStudent,
  logoutUser,
  verifyEmailCode,
  resendVerificationCode,
  isUlbsEmail,
} from "@/lib/auth";
import { UserRole, EngineeringDomain } from "@prisma/client";

export type AuthState = {
  success: boolean;
  message?: string;
  error?: string;
  requiresVerification?: boolean;
  email?: string;
};

export async function loginAction(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Vă rugăm să completați adresa de email și parola." };
  }

  try {
    await loginUser(email, password);
    revalidatePath("/");
    return { success: true, message: "Autentificare reușită!" };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Eroare la autentificare.";
    const isEmailNotVerified =
      errorMsg.includes("EMAIL_NOT_VERIFIED") ||
      (err as any)?.code === "EMAIL_NOT_VERIFIED";

    if (isEmailNotVerified) {
      return {
        success: false,
        error: "Adresa de email nu a fost verificată. Introduceți codul de 6 cifre primit pe email pentru a vă activa contul.",
        requiresVerification: true,
        email: email.toLowerCase().trim(),
      };
    }

    return { success: false, error: errorMsg };
  }
}

export async function registerAction(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const role = formData.get("role") as UserRole;

  if (!email || !password || !firstName || !lastName || !role) {
    return { success: false, error: "Toate câmpurile de bază sunt obligatorii." };
  }

  if (password.length < 6) {
    return { success: false, error: "Parola trebuie să aibă cel puțin 6 caractere." };
  }

  // Verificare domeniu instituțional pentru rolurile academice ULBS
  if (role === UserRole.STUDENT && !isUlbsEmail(email)) {
    return {
      success: false,
      error: "Înregistrarea studenților este permisă exclusiv cu adresa de email instituțională (@student.ulbsibiu.ro sau @ulbsibiu.ro).",
    };
  }

  if (role === UserRole.COORDINATOR && !isUlbsEmail(email)) {
    return {
      success: false,
      error: "Înregistrarea coordonatorilor este permisă exclusiv cu adresa de email instituțională (@ulbsibiu.ro).",
    };
  }

  try {
    const specialization = (formData.get("specialization") as string) || undefined;
    const studyYear = formData.get("studyYear") ? Number(formData.get("studyYear")) : undefined;
    const group = (formData.get("group") as string) || undefined;
    const domain = (formData.get("domain") as EngineeringDomain) || undefined;

    const companyName = (formData.get("companyName") as string) || undefined;
    const cuiCif = (formData.get("cuiCif") as string) || undefined;
    const city = (formData.get("city") as string) || undefined;
    const address = (formData.get("address") as string) || undefined;

    const result = await registerUser({
      email,
      password,
      firstName,
      lastName,
      role,
      specialization,
      studyYear,
      group,
      domain,
      companyName,
      cuiCif,
      city,
      address,
    });

    revalidatePath("/");

    if (result.requiresVerification) {
      return {
        success: true,
        message: "Cont creat! Vă rugăm să introduceți codul de 6 cifre primit pe email pentru activarea contului.",
        requiresVerification: true,
        email: result.email,
      };
    }

    return { success: true, message: "Cont creat cu succes!" };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Eroare la înregistrare.";
    return { success: false, error: errorMsg };
  }
}

export async function verifyEmailAction(
  email: string,
  code: string
): Promise<AuthState> {
  if (!email || !code) {
    return { success: false, error: "Adresa de email și codul sunt obligatorii.", requiresVerification: true, email };
  }

  try {
    const res = await verifyEmailCode(email, code);
    revalidatePath("/");
    return { success: true, message: res.message };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Eroare la verificarea codului.";
    return { success: false, error: errorMsg, requiresVerification: true, email };
  }
}

export async function resendVerificationCodeAction(
  email: string
): Promise<AuthState> {
  if (!email) {
    return { success: false, error: "Adresa de email este obligatorie." };
  }

  try {
    const res = await resendVerificationCode(email);
    return { success: true, message: res.message, requiresVerification: true, email };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Eroare la retrimiterea codului.";
    return { success: false, error: errorMsg, requiresVerification: true, email };
  }
}

export async function logoutAction() {
  await logoutUser();
  revalidatePath("/");
}

export async function demoLoginAction(role: "STUDENT" | "COMPANY_TUTOR" | "COORDINATOR" | "ADMIN"): Promise<AuthState> {
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN !== "true") {
    return {
      success: false,
      error: "403 Forbidden: Autentificarea demo este dezactivată în acest mediu.",
    };
  }

  const demoAccounts: Record<string, { email: string; pass: string }> = {
    STUDENT: { email: "alexandru.radu@student.ulbsibiu.ro", pass: "DemoStudent2026!" },
    COMPANY_TUTOR: { email: "recruitment@continental-sibiu.com", pass: "DemoCompany2026!" },
    COORDINATOR: { email: "coordonator.practica@ulbsibiu.ro", pass: process.env.COORDINATOR_SEED_PASSWORD || "CoordULBS2026!" },
    ADMIN: { email: "admin@ulbsibiu.ro", pass: process.env.ADMIN_SEED_PASSWORD || "AdminULBS2026!" },
  };

  const account = demoAccounts[role];
  if (!account) {
    return { success: false, error: "Rol demo invalid." };
  }

  try {
    await loginUser(account.email, account.pass);
    revalidatePath("/");
    return { success: true, message: `Autentificare demo ca ${role} reușită!` };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Eroare la autentificare demo.";
    return { success: false, error: errorMsg };
  }
}
