"use server";

import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { UserRole, ConventionStatus, PlacementStatus } from "@prisma/client";
import { generateConventionPdf } from "@/lib/conventions/generator";
import { ensureStorageDirs, getSignedConventionPath } from "@/lib/storage";

async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Neautentificat.");
  return user;
}

/**
 * Generează convenția PDF oficială ULBS pentru un plasament CONFIRMED.
 */
export async function generateConventionForPlacement(placementId: string) {
  const user = await requireAuth();

  const placement = await prisma.placement.findUnique({
    where: { id: placementId },
    include: {
      student: true,
      offer: { include: { company: true } },
    },
  });

  if (!placement) {
    throw new Error("Plasamentul specificat nu a fost găsit.");
  }

  if (placement.status !== PlacementStatus.CONFIRMED) {
    throw new Error("Convenția poate fi generată doar pentru plasamente confirmate.");
  }

  // Verificare drepturi de acces
  if (
    user.role === UserRole.STUDENT &&
    user.studentProfile?.id !== placement.studentId
  ) {
    throw new Error("Nu aveți permisiunea de a genera convenția pentru acest plasament.");
  }

  if (
    user.role === UserRole.COMPANY_TUTOR &&
    user.companyProfile?.id !== placement.offer.companyId
  ) {
    throw new Error("Nu aveți permisiunea de a genera convenția pentru acest plasament.");
  }

  const result = await generateConventionPdf(placementId);

  revalidatePath("/");
  return {
    success: true,
    conventionId: result.conventionId,
    conventionNumber: result.conventionNumber,
  };
}

/**
 * Marchează convenția ca semnată de către student.
 */
export async function markConventionSignedByStudent(conventionId: string) {
  const user = await requireAuth();

  const convention = await prisma.internshipConvention.findUnique({
    where: { id: conventionId },
    include: { placement: true },
  });

  if (!convention) {
    throw new Error("Convenția specificată nu a fost găsită.");
  }

  if (
    user.role === UserRole.STUDENT &&
    user.studentProfile?.id !== convention.placement.studentId
  ) {
    throw new Error("Doar studentul asociat poate semna această convenție.");
  }

  const updated = await prisma.internshipConvention.update({
    where: { id: conventionId },
    data: {
      status: ConventionStatus.SIGNED_BY_STUDENT,
      signedAt: new Date(),
    },
  });

  revalidatePath("/");
  return { success: true, convention: updated };
}

/**
 * Încarcă scanul convenției semnate (PDF, PNG sau JPG).
 */
export async function uploadSignedConventionScan(
  conventionId: string,
  formData: FormData
) {
  const user = await requireAuth();

  const convention = await prisma.internshipConvention.findUnique({
    where: { id: conventionId },
    include: { placement: true },
  });

  if (!convention) {
    throw new Error("Convenția nu a fost găsită.");
  }

  if (
    user.role === UserRole.STUDENT &&
    user.studentProfile?.id !== convention.placement.studentId
  ) {
    throw new Error("Nu aveți permisiunea de a încărca scanul acestei convenții.");
  }

  const file = formData.get("signedScan") as File | null;
  if (!file || !(file instanceof File) || file.size === 0) {
    throw new Error("Fișierul selectat este invalid sau gol.");
  }

  const extension = path.extname(file.name).toLowerCase();
  const allowedExtensions = [".pdf", ".png", ".jpg", ".jpeg"];
  if (!allowedExtensions.includes(extension)) {
    throw new Error("Format nepermis! Se acceptă doar fișiere PDF, PNG sau JPG.");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Dimensiunea fișierului depășește limita de 10 MB.");
  }

  await ensureStorageDirs();
  const safeFilename = `signed_${conventionId}_${Date.now()}${extension}`;
  const targetPath = getSignedConventionPath(safeFilename);

  const bytes = await file.arrayBuffer();
  await fs.writeFile(targetPath, Buffer.from(bytes));

  const updated = await prisma.internshipConvention.update({
    where: { id: conventionId },
    data: {
      signedPdfUrl: safeFilename,
      status: ConventionStatus.SIGNED_BY_STUDENT,
      signedAt: convention.signedAt || new Date(),
    },
  });

  revalidatePath("/");
  return { success: true, convention: updated, filename: safeFilename };
}

/**
 * Aprobă convenția de către coordonatorul academic.
 */
export async function approveConventionByCoordinator(conventionId: string) {
  const user = await requireAuth();
  if (user.role !== UserRole.COORDINATOR && user.role !== UserRole.ADMIN) {
    throw new Error("Doar coordonatorii pot aproba convențiile.");
  }

  const updated = await prisma.internshipConvention.update({
    where: { id: conventionId },
    data: {
      status: ConventionStatus.APPROVED_BY_COORDINATOR,
      approvedAt: new Date(),
    },
  });

  revalidatePath("/");
  return { success: true, convention: updated };
}

/**
 * Returnează detaliile unei convenții după ID.
 */
export async function getConventionDetails(conventionId: string) {
  await requireAuth();
  return prisma.internshipConvention.findUnique({
    where: { id: conventionId },
    include: {
      placement: {
        include: {
          student: { include: { user: true } },
          offer: { include: { company: { include: { user: true } } } },
        },
      },
    },
  });
}
