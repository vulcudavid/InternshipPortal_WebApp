"use server";

import prisma from "@/lib/prisma";
import { requireAdminUser } from "@/lib/admin-guard";
import { hashPassword } from "@/lib/auth";
import { UserRole, EngineeringDomain } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Creare manuală a unui utilizator de către Administrator.
 * Utilizatorii creați de Admin sunt pre-verificați direct (emailVerified: true).
 */
export async function adminCreateUser(params: {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  specialization?: string;
  studyYear?: number;
  group?: string;
  domain?: EngineeringDomain;
  companyName?: string;
  cuiCif?: string;
  city?: string;
  address?: string;
}) {
  await requireAdminUser();

  const email = params.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    throw new Error("Un utilizator cu această adresă de email există deja.");
  }

  const generatedPassword = params.password || "ULBS2026!Secured";
  const passwordHash = hashPassword(generatedPassword);

  const newUser = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: params.firstName.trim(),
      lastName: params.lastName.trim(),
      role: params.role,
      emailVerified: true, // Utilizatorii creați manual de Admin au emailVerified: true
      isActive: true,
    },
  });

  if (params.role === UserRole.STUDENT) {
    await prisma.studentProfile.create({
      data: {
        userId: newUser.id,
        faculty: "Facultatea de Inginerie ULBS",
        specialization: params.specialization || "Calculatoare",
        studyYear: Number(params.studyYear) || 3,
        group: params.group || "331",
        domain: params.domain || EngineeringDomain.COMPUTER_SCIENCE_IT,
      },
    });
  } else if (params.role === UserRole.COMPANY_TUTOR) {
    await prisma.companyProfile.create({
      data: {
        userId: newUser.id,
        companyName: params.companyName || `${params.lastName} Partner`,
        cuiCif: params.cuiCif || `RO${Date.now().toString().slice(-8)}`,
        city: params.city || "Sibiu",
        address: params.address || "Str. Principală",
      },
    });
  }

  revalidatePath("/admin");
  return { success: true, user: newUser };
}
