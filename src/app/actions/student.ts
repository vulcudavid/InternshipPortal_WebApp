"use server";

import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDomainForSpecialization } from "@/lib/specializations";
import { ProficiencyLevel, UserRole, EngineeringDomain } from "@prisma/client";

/**
 * Verifică autentificarea și obține profilul de student al utilizatorului curent
 */
async function requireStudentProfile() {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.STUDENT || !user.studentProfile) {
    throw new Error("Acces neautorizat. Doar studenții pot efectua această acțiune.");
  }
  return { user, profile: user.studentProfile };
}

/**
 * 1. Actualizare Profil Social și Date Academice Oficiale ULBS
 */
export async function updateStudentProfile(params: {
  specialization: string;
  studyYear: number;
  group: string;
  headline?: string | null;
  bio?: string | null;
  phone?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  availableFrom?: string | null;
  availableTo?: string | null;
}) {
  const { profile } = await requireStudentProfile();

  const domain = getDomainForSpecialization(params.specialization);

  await prisma.studentProfile.update({
    where: { id: profile.id },
    data: {
      specialization: params.specialization.trim(),
      studyYear: Number(params.studyYear),
      group: params.group.trim(),
      domain: domain,
      headline: params.headline?.trim() || null,
      bio: params.bio?.trim() || null,
      phone: params.phone?.trim() || null,
      githubUrl: params.githubUrl?.trim() || null,
      linkedinUrl: params.linkedinUrl?.trim() || null,
      portfolioUrl: params.portfolioUrl?.trim() || null,
      availableFrom: params.availableFrom ? new Date(params.availableFrom) : null,
      availableTo: params.availableTo ? new Date(params.availableTo) : null,
    },
  });

  revalidatePath("/");
  return { success: true, message: "Profilul a fost actualizat cu succes!" };
}

/**
 * 2. Actualizare Competențe / Tag-uri (catalog 41 tag-uri + tag-uri custom)
 */
export interface SkillPayload {
  tagId?: string;
  name: string;
  domain?: EngineeringDomain;
  proficiency: ProficiencyLevel;
  isCustom?: boolean;
}

export async function updateStudentSkills(skills: SkillPayload[]) {
  const { profile } = await requireStudentProfile();

  // Pregătim ID-urile tag-urilor
  const tagEntries: { tagId: string; proficiency: ProficiencyLevel }[] = [];

  for (const skill of skills) {
    let resolvedTagId = skill.tagId;

    if (!resolvedTagId) {
      // Verificăm dacă există deja după nume
      const existing = await prisma.tag.findUnique({
        where: { name: skill.name.trim() },
      });

      if (existing) {
        resolvedTagId = existing.id;
      } else {
        // Creăm tag nou custom
        const created = await prisma.tag.create({
          data: {
            name: skill.name.trim(),
            domain: skill.domain || profile.domain || "COMPUTER_SCIENCE_IT",
            isPredefined: false,
          },
        });
        resolvedTagId = created.id;
      }
    }

    tagEntries.push({
      tagId: resolvedTagId,
      proficiency: skill.proficiency,
    });
  }

  // Sincronizare atomică în baza de date
  await prisma.$transaction(async (tx) => {
    await tx.studentTag.deleteMany({
      where: { studentId: profile.id },
    });

    if (tagEntries.length > 0) {
      await tx.studentTag.createMany({
        data: tagEntries.map((t) => ({
          studentId: profile.id,
          tagId: t.tagId,
          proficiency: t.proficiency,
        })),
      });
    }
  });

  revalidatePath("/");
  return { success: true, count: tagEntries.length };
}

/**
 * 3. Salvare link CV extern (Google Drive, LinkedIn, cloud etc.)
 */
export async function saveCvLink(url: string) {
  const { profile } = await requireStudentProfile();
  const trimmed = url.trim();

  if (!trimmed) {
    throw new Error("Adresa URL a CV-ului este obligatorie.");
  }

  await prisma.studentProfile.update({
    where: { id: profile.id },
    data: { cvUrl: trimmed },
  });

  revalidatePath("/");
  return { success: true, cvUrl: trimmed };
}

/**
 * 4. Upload fișier PDF CV pe server (salvat în public/uploads/cvs/)
 */
export async function uploadCvFile(formData: FormData) {
  const { profile } = await requireStudentProfile();

  const file = formData.get("cvFile") as File | null;
  if (!file || !(file instanceof File) || file.size === 0) {
    throw new Error("Fișierul selectat este invalid sau gol.");
  }

  // Validare tip fișier: PDF
  if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
    throw new Error("Format nepermis! Te rugăm să încarci un fișier în format PDF.");
  }

  // Limită de dimensiune: 10MB
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error("Dimensiunea fișierului depășește limita maximă de 10 MB.");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "cvs");
  await fs.mkdir(uploadsDir, { recursive: true });

  const safeFileName = `cv-${profile.id}-${Date.now()}.pdf`;
  const filePath = path.join(uploadsDir, safeFileName);
  await fs.writeFile(filePath, buffer);

  const publicUrl = `/uploads/cvs/${safeFileName}`;

  await prisma.studentProfile.update({
    where: { id: profile.id },
    data: { cvUrl: publicUrl },
  });

  revalidatePath("/");
  return { success: true, cvUrl: publicUrl, fileName: file.name };
}

/**
 * 5. Adăugare ofertă de practică la lista de preferințe ordonate (StudentPreference)
 */
export async function addStudentPreference(offerId: string) {
  const { profile } = await requireStudentProfile();

  const offer = await prisma.internshipOffer.findUnique({
    where: { id: offerId },
  });

  if (!offer) {
    throw new Error("Oferta specificată nu a fost găsită.");
  }

  // Verifică dacă există deja în preferințe
  const existing = await prisma.studentPreference.findUnique({
    where: {
      studentId_offerId: {
        studentId: profile.id,
        offerId: offerId,
      },
    },
  });

  if (existing) {
    return { success: true, alreadyExists: true, message: "Oferta este deja în lista de preferințe." };
  }

  // Află ultimul rang
  const highestRankPref = await prisma.studentPreference.findFirst({
    where: { studentId: profile.id },
    orderBy: { rank: "desc" },
  });

  const nextRank = (highestRankPref?.rank || 0) + 1;

  await prisma.studentPreference.create({
    data: {
      studentId: profile.id,
      offerId: offerId,
      rank: nextRank,
    },
  });

  revalidatePath("/");
  return { success: true, rank: nextRank };
}

/**
 * 6. Eliminare ofertă din preferințe și renumerotare compactă a rangurilor
 */
export async function removeStudentPreference(preferenceId: string) {
  const { profile } = await requireStudentProfile();

  await prisma.$transaction(async (tx) => {
    // Șterge preferința vizată
    await tx.studentPreference.delete({
      where: {
        id: preferenceId,
        studentId: profile.id,
      },
    });

    // Reordonare compactă 1..N pentru cele rămase
    const remaining = await tx.studentPreference.findMany({
      where: { studentId: profile.id },
      orderBy: { rank: "asc" },
    });

    // Folosim numere temporare negative pentru a evita violarea constrângerii de unicitate
    for (let i = 0; i < remaining.length; i++) {
      await tx.studentPreference.update({
        where: { id: remaining[i].id },
        data: { rank: -(i + 1) },
      });
    }

    for (let i = 0; i < remaining.length; i++) {
      await tx.studentPreference.update({
        where: { id: remaining[i].id },
        data: { rank: i + 1 },
      });
    }
  });

  revalidatePath("/");
  return { success: true };
}

/**
 * 7. Reordonare listă preferințe (Swap / Move Up / Move Down)
 * Tranzacție sigură ce previne coliziunile de unicitate pe @@unique([studentId, rank])
 */
export async function reorderStudentPreferences(orderedPreferenceIds: string[]) {
  const { profile } = await requireStudentProfile();

  await prisma.$transaction(async (tx) => {
    // 1. Schimbăm la ranguri negative temporare
    for (let i = 0; i < orderedPreferenceIds.length; i++) {
      await tx.studentPreference.updateMany({
        where: {
          id: orderedPreferenceIds[i],
          studentId: profile.id,
        },
        data: { rank: -(i + 1) },
      });
    }

    // 2. Setăm rangurile finale pozitive (1, 2, 3...)
    for (let i = 0; i < orderedPreferenceIds.length; i++) {
      await tx.studentPreference.updateMany({
        where: {
          id: orderedPreferenceIds[i],
          studentId: profile.id,
        },
        data: { rank: i + 1 },
      });
    }
  });

  revalidatePath("/");
  return { success: true };
}
