"use server";

import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDomainForSpecialization } from "@/lib/specializations";
import { ProficiencyLevel, UserRole, EngineeringDomain, PlacementStatus, NotificationType } from "@prisma/client";
import { ensureStorageDirs, getPrivateCvPath } from "@/lib/storage";
import { createNotification, notifyCoordinators } from "@/lib/notifications";

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
  gdprConsent?: boolean;
}) {
  const { profile } = await requireStudentProfile();

  const domain = getDomainForSpecialization(params.specialization);

  const updateData: any = {
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
  };

  if (params.gdprConsent !== undefined) {
    updateData.gdprConsent = params.gdprConsent;
    updateData.gdprConsentAt = params.gdprConsent ? new Date() : null;
  }

  await prisma.studentProfile.update({
    where: { id: profile.id },
    data: updateData,
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
 * 4. Upload fișier PDF CV pe server (salvat securizat în storage/cvs/)
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

  await ensureStorageDirs();

  const safeFileName = `cv-${profile.id}-${Date.now()}.pdf`;
  const filePath = getPrivateCvPath(safeFileName);
  await fs.writeFile(filePath, buffer);

  await prisma.studentProfile.update({
    where: { id: profile.id },
    data: { cvUrl: safeFileName },
  });

  revalidatePath("/");
  return { success: true, cvUrl: safeFileName, fileName: file.name };
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

/**
 * 8. Rezervare slot de interviu de către student
 */
export async function bookInterviewSlot(slotId: string) {
  const { user, profile } = await requireStudentProfile();

  const slot = await prisma.interviewSlot.findUnique({
    where: { id: slotId },
    include: {
      offer: {
        include: {
          company: true,
        },
      },
    },
  });

  if (!slot) {
    throw new Error("Slotul de interviu nu a fost găsit.");
  }

  if (slot.isBooked) {
    throw new Error("Acest slot de interviu a fost deja rezervat.");
  }

  // Verifică dacă studentul are deja un alt slot rezervat pentru aceeași ofertă
  const existingBooking = await prisma.interviewSlot.findFirst({
    where: {
      offerId: slot.offerId,
      studentId: profile.id,
    },
  });

  if (existingBooking) {
    throw new Error("Ai deja un slot de interviu programat pentru această ofertă.");
  }

  await prisma.interviewSlot.update({
    where: { id: slotId },
    data: {
      studentId: profile.id,
      isBooked: true,
    },
  });

  const formattedDate = new Date(slot.startTime).toLocaleString("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Notificare Companie (Tutore)
  await createNotification({
    userId: slot.offer.company.userId,
    title: "Interviu programat de un student",
    message: `Studentul ${user.firstName} ${user.lastName} (${profile.specialization}) a rezervat un interviu pentru oferta "${slot.offer.title}" la data de ${formattedDate}.`,
    type: NotificationType.SYSTEM_ALERT,
  });

  // Notificare Student (Confirmare)
  await createNotification({
    userId: user.id,
    title: "Confirmare programare interviu",
    message: `Ai programat cu succes interviul pentru oferta "${slot.offer.title}" la compania ${slot.offer.company.companyName} pe ${formattedDate}.`,
    type: NotificationType.SYSTEM_ALERT,
  });

  revalidatePath("/");
  return { success: true };
}

/**
 * 9. Anulare rezervare slot de interviu de către student
 */
export async function cancelInterviewBooking(slotId: string) {
  const { user, profile } = await requireStudentProfile();

  const slot = await prisma.interviewSlot.findUnique({
    where: { id: slotId },
    include: {
      offer: {
        include: {
          company: true,
        },
      },
    },
  });

  if (!slot || slot.studentId !== profile.id) {
    throw new Error("Nu ai nicio rezervare activă pe acest slot de interviu.");
  }

  await prisma.interviewSlot.update({
    where: { id: slotId },
    data: {
      studentId: null,
      isBooked: false,
    },
  });

  // Notificare Companie (Tutore)
  await createNotification({
    userId: slot.offer.company.userId,
    title: "Interviu anulat de student",
    message: `Studentul ${user.firstName} ${user.lastName} a anulat programarea la interviu pentru oferta "${slot.offer.title}".`,
    type: NotificationType.SYSTEM_ALERT,
  });

  revalidatePath("/");
  return { success: true };
}

/**
 * 10. Refuzul locului repartizat de către student (Cerința 9)
 * Setează statusul la REFUSED_BY_STUDENT, eliberează locul la ofertă și notifică coordonatorul academic.
 */
export async function refusePlacement(placementId: string) {
  const { user, profile } = await requireStudentProfile();

  const placement = await prisma.placement.findUnique({
    where: { id: placementId },
    include: {
      offer: {
        include: {
          company: true,
        },
      },
    },
  });

  if (!placement || placement.studentId !== profile.id) {
    throw new Error("Plasamentul nu a fost găsit sau nu vă aparține.");
  }

  if (placement.status !== PlacementStatus.PENDING_CONFIRMATION) {
    throw new Error("Doar plasamentele în așteptare de confirmare (PENDING_CONFIRMATION) pot fi refuzate.");
  }

  await prisma.$transaction(async (tx) => {
    // 1. Setăm statusul la REFUSED_BY_STUDENT
    await tx.placement.update({
      where: { id: placementId },
      data: {
        status: PlacementStatus.REFUSED_BY_STUDENT,
        cancelledAt: new Date(),
        cancelReason: "Refuzat de către student",
      },
    });

    // 2. Eliberăm locul la oferta de practică
    await tx.internshipOffer.update({
      where: { id: placement.offerId },
      data: {
        slotsAvailable: {
          increment: 1,
        },
      },
    });
  });

  // 3. Notificăm coordonatorii academici
  await notifyCoordinators({
    title: "Loc de practică refuzat de student",
    message: `Studentul ${user.firstName} ${user.lastName} (${profile.specialization}, Gr. ${profile.group}) a refuzat locul repartizat la oferta "${placement.offer.title}" (${placement.offer.company.companyName}).`,
    type: NotificationType.PLACEMENT_CANCELLED,
  });

  revalidatePath("/");
  return { success: true, message: "Ați refuzat locul repartizat. Coordonatorul a fost notificat." };
}
