"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { UserRole, EngineeringDomain, OfferStatus, PlacementStatus, NotificationType } from "@prisma/client";
import { handleMinimalReallocation, OfferPreferences, StudentPreferences } from "@/lib/matching";
import { createNotification } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

/**
 * Helper intern pentru verificarea sesiunii de companie / tutore
 */
export async function requireCompanyProfile() {
  const user = await getCurrentUser();

  if (!user || user.role !== UserRole.COMPANY_TUTOR || !user.companyProfile) {
    throw new Error("Acces neautorizat. Doar companiile partenere pot accesa aceste funcționalități.");
  }

  return { user, profile: user.companyProfile };
}

/**
 * 1. Actualizare Profil Companie și date de contact tutore
 */
export async function updateCompanyProfile(data: {
  companyName: string;
  cuiCif: string;
  address: string;
  city: string;
  website?: string;
  description?: string;
  contactPhone?: string;
}) {
  const { profile } = await requireCompanyProfile();

  if (!data.companyName.trim()) {
    throw new Error("Numele companiei este obligatoriu.");
  }
  if (!data.cuiCif.trim()) {
    throw new Error("Codul CUI/CIF este obligatoriu.");
  }
  if (!data.city.trim() || !data.address.trim()) {
    throw new Error("Orașul și adresa sediului sunt obligatorii.");
  }

  // Verificare unicitate CUI/CIF dacă a fost modificat
  if (data.cuiCif.trim() !== profile.cuiCif) {
    const existing = await prisma.companyProfile.findUnique({
      where: { cuiCif: data.cuiCif.trim() },
    });
    if (existing && existing.id !== profile.id) {
      throw new Error("Un profil de companie cu acest CUI/CIF este deja înregistrat.");
    }
  }

  const updated = await prisma.companyProfile.update({
    where: { id: profile.id },
    data: {
      companyName: data.companyName.trim(),
      cuiCif: data.cuiCif.trim(),
      address: data.address.trim(),
      city: data.city.trim(),
      website: data.website?.trim() || null,
      description: data.description?.trim() || null,
      contactPhone: data.contactPhone?.trim() || null,
    },
  });

  revalidatePath("/");
  return { success: true, profile: updated };
}

/**
 * 2. Creare / Editare Ofertă de Practică cu competențe (OfferTag)
 */
export async function upsertInternshipOffer(data: {
  id?: string;
  title: string;
  description: string;
  domains?: EngineeringDomain[];
  primaryDomain?: EngineeringDomain | null;
  slotsTotal: number;
  location: string;
  isRemote: boolean;
  startDate: string;
  endDate: string;
  tutorName: string;
  tutorEmail: string;
  tags: { tagId: string; isRequired: boolean; weight?: number }[];
}) {
  const { profile } = await requireCompanyProfile();

  if (!data.title.trim()) throw new Error("Titlul ofertei este obligatoriu.");
  if (!data.description.trim()) throw new Error("Descrierea ofertei este obligatorie.");
  if (!data.location.trim()) throw new Error("Locația este obligatorie.");
  if (!data.tutorName.trim()) throw new Error("Numele tutorelui este obligatoriu.");
  if (!data.tutorEmail.trim()) throw new Error("Emailul tutorelui este obligatoriu.");
  if (data.slotsTotal < 1) throw new Error("Numărul total de locuri trebuie să fie cel puțin 1.");

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Datele de început și sfârșit sunt invalide.");
  }
  if (start >= end) {
    throw new Error("Data de început trebuie să fie anterioară datei de finalizare.");
  }

  const normalizedDomains = Array.from(
    new Set(
      data.domains !== undefined
        ? data.domains
        : data.primaryDomain
          ? [data.primaryDomain]
          : []
    )
  );
  const fallbackPrimaryDomain = normalizedDomains[0] ?? null;

  if (data.id) {
    const existing = await prisma.internshipOffer.findUnique({
      where: { id: data.id },
    });

    if (!existing || existing.companyId !== profile.id) {
      throw new Error("Oferta specificată nu există sau nu aparține companiei dvs.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.internshipOffer.update({
        where: { id: data.id },
        data: {
          title: data.title.trim(),
          description: data.description.trim(),
          domains: normalizedDomains,
          primaryDomain: fallbackPrimaryDomain,
          slotsTotal: data.slotsTotal,
          slotsAvailable: Math.max(0, data.slotsTotal - (existing.slotsTotal - existing.slotsAvailable)),
          location: data.location.trim(),
          isRemote: data.isRemote,
          startDate: start,
          endDate: end,
          tutorName: data.tutorName.trim(),
          tutorEmail: data.tutorEmail.trim(),
        },
      });

      await tx.offerTag.deleteMany({
        where: { offerId: data.id },
      });

      if (data.tags && data.tags.length > 0) {
        await tx.offerTag.createMany({
          data: data.tags.map((t) => ({
            offerId: data.id!,
            tagId: t.tagId,
            isRequired: t.isRequired,
            weight: t.weight || (t.isRequired ? 1.0 : 0.8),
          })),
        });
      }
    });

    revalidatePath("/");
    return { success: true, offerId: data.id };
  } else {
    const newOffer = await prisma.$transaction(async (tx) => {
      const created = await tx.internshipOffer.create({
        data: {
          companyId: profile.id,
          title: data.title.trim(),
          description: data.description.trim(),
          domains: normalizedDomains,
          primaryDomain: fallbackPrimaryDomain,
          slotsTotal: data.slotsTotal,
          slotsAvailable: data.slotsTotal,
          location: data.location.trim(),
          isRemote: data.isRemote,
          startDate: start,
          endDate: end,
          tutorName: data.tutorName.trim(),
          tutorEmail: data.tutorEmail.trim(),
          status: OfferStatus.ACTIVE,
        },
      });

      if (data.tags && data.tags.length > 0) {
        await tx.offerTag.createMany({
          data: data.tags.map((t) => ({
            offerId: created.id,
            tagId: t.tagId,
            isRequired: t.isRequired,
            weight: t.weight || (t.isRequired ? 1.0 : 0.8),
          })),
        });
      }

      return created;
    });

    revalidatePath("/");
    return { success: true, offerId: newOffer.id };
  }
}

/**
 * 3. Schimbare status ofertă (Activare / Închidere)
 */
export async function toggleOfferStatus(offerId: string) {
  const { profile } = await requireCompanyProfile();

  const offer = await prisma.internshipOffer.findUnique({
    where: { id: offerId },
  });

  if (!offer || offer.companyId !== profile.id) {
    throw new Error("Oferta nu a fost găsită.");
  }

  const nextStatus = offer.status === OfferStatus.ACTIVE ? OfferStatus.CLOSED : OfferStatus.ACTIVE;

  await prisma.internshipOffer.update({
    where: { id: offerId },
    data: { status: nextStatus },
  });

  revalidatePath("/");
  return { success: true, status: nextStatus };
}

/**
 * 4. Ștergere ofertă
 */
export async function deleteOffer(offerId: string) {
  const { profile } = await requireCompanyProfile();

  const offer = await prisma.internshipOffer.findUnique({
    where: { id: offerId },
    include: { placements: true },
  });

  if (!offer || offer.companyId !== profile.id) {
    throw new Error("Oferta nu a fost găsită.");
  }

  if (offer.placements.length > 0) {
    throw new Error("Nu poți șterge o ofertă care are deja studenți plasați.");
  }

  await prisma.internshipOffer.delete({
    where: { id: offerId },
  });

  revalidatePath("/");
  return { success: true };
}

/**
 * 5. Adăugare candidat în clasamentul ofertei (CompanyApplicantRank)
 */
export async function rankApplicant(offerId: string, studentId: string) {
  const { profile } = await requireCompanyProfile();

  const offer = await prisma.internshipOffer.findUnique({
    where: { id: offerId },
  });

  if (!offer || offer.companyId !== profile.id) {
    throw new Error("Oferta specificată nu aparține acestei companii.");
  }

  const existing = await prisma.companyApplicantRank.findUnique({
    where: {
      offerId_studentId: {
        offerId,
        studentId,
      },
    },
  });

  if (existing) {
    return { success: true, message: "Candidatul este deja în clasament." };
  }

  const highest = await prisma.companyApplicantRank.findFirst({
    where: { offerId },
    orderBy: { rank: "desc" },
  });

  const nextRank = (highest?.rank || 0) + 1;

  await prisma.companyApplicantRank.create({
    data: {
      offerId,
      studentId,
      rank: nextRank,
    },
  });

  revalidatePath("/");
  return { success: true, rank: nextRank };
}

/**
 * 6. Reordonare Clasament Aplicanți (Gale-Shapley input)
 * Folosește o tranzacție sigură în 2 pași cu ranguri negative temporare
 * pentru a satisface constrângerea @@unique([offerId, rank]).
 */
export async function reorderCompanyApplicantRanks(offerId: string, orderedRankIds: string[]) {
  const { profile } = await requireCompanyProfile();

  const offer = await prisma.internshipOffer.findUnique({
    where: { id: offerId },
  });

  if (!offer || offer.companyId !== profile.id) {
    throw new Error("Oferta nu aparține acestei companii.");
  }

  await prisma.$transaction(async (tx) => {
    // Pasul 1: Atribuire ranguri negative temporare
    for (let i = 0; i < orderedRankIds.length; i++) {
      await tx.companyApplicantRank.updateMany({
        where: {
          id: orderedRankIds[i],
          offerId: offerId,
        },
        data: { rank: -(i + 1) },
      });
    }

    // Pasul 2: Atribuire ranguri finale pozitive (1, 2, 3...)
    for (let i = 0; i < orderedRankIds.length; i++) {
      await tx.companyApplicantRank.updateMany({
        where: {
          id: orderedRankIds[i],
          offerId: offerId,
        },
        data: { rank: i + 1 },
      });
    }
  });

  revalidatePath("/");
  return { success: true };
}

/**
 * 7. Eliminare candidat din clasament și renumerotare compactă 1..N
 */
export async function removeCompanyApplicantRank(rankId: string) {
  const { profile } = await requireCompanyProfile();

  const rankEntry = await prisma.companyApplicantRank.findUnique({
    where: { id: rankId },
    include: { offer: true },
  });

  if (!rankEntry || rankEntry.offer.companyId !== profile.id) {
    throw new Error("Înregistrarea nu a fost găsită sau nu aparține companiei.");
  }

  const offerId = rankEntry.offerId;

  await prisma.$transaction(async (tx) => {
    await tx.companyApplicantRank.delete({
      where: { id: rankId },
    });

    const remaining = await tx.companyApplicantRank.findMany({
      where: { offerId },
      orderBy: { rank: "asc" },
    });

    for (let i = 0; i < remaining.length; i++) {
      await tx.companyApplicantRank.update({
        where: { id: remaining[i].id },
        data: { rank: -(i + 1) },
      });
    }

    for (let i = 0; i < remaining.length; i++) {
      await tx.companyApplicantRank.update({
        where: { id: remaining[i].id },
        data: { rank: i + 1 },
      });
    }
  });

  revalidatePath("/");
  return { success: true };
}

/**
 * 8. Creare Slot Interviu pentru o ofertă
 */
export async function createInterviewSlot(data: {
  offerId: string;
  startTime: string;
  endTime: string;
  meetingLink?: string;
}) {
  const { profile } = await requireCompanyProfile();

  const offer = await prisma.internshipOffer.findUnique({
    where: { id: data.offerId },
  });

  if (!offer || offer.companyId !== profile.id) {
    throw new Error("Oferta nu aparține acestei companii.");
  }

  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Intervalul orar este invalid.");
  }
  if (start >= end) {
    throw new Error("Ora de început trebuie să fie anterioară orei de sfârșit.");
  }

  const slot = await prisma.interviewSlot.create({
    data: {
      offerId: data.offerId,
      startTime: start,
      endTime: end,
      meetingLink: data.meetingLink?.trim() || null,
      isBooked: false,
    },
  });

  const formattedStart = start.toLocaleString("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Notificăm candidații care au aplicat sau au această ofertă în preferințe
  const applicants = await prisma.companyApplicantRank.findMany({
    where: { offerId: data.offerId },
    include: {
      student: {
        include: { user: true },
      },
    },
  });

  for (const app of applicants) {
    await createNotification({
      userId: app.student.user.id,
      title: "Interval nou de interviu disponibil",
      message: `Compania ${profile.companyName} a adăugat un nou slot de interviu pentru oferta "${offer.title}" la data de ${formattedStart}.`,
      type: NotificationType.SYSTEM_ALERT,
    });
  }

  revalidatePath("/");
  return { success: true, slotId: slot.id };
}

/**
 * 9. Ștergere Slot Interviu
 */
export async function deleteInterviewSlot(slotId: string) {
  const { profile } = await requireCompanyProfile();

  const slot = await prisma.interviewSlot.findUnique({
    where: { id: slotId },
    include: { offer: true },
  });

  if (!slot || slot.offer.companyId !== profile.id) {
    throw new Error("Slotul de interviu nu a fost găsit.");
  }

  await prisma.interviewSlot.delete({
    where: { id: slotId },
  });

  revalidatePath("/");
  return { success: true };
}

/**
 * 10. Anulare Plasament de către Companie (D-005)
 * Declanșează realocarea minimală pentru candidatul de pe poziția eliberată
 */
export async function cancelPlacementByCompany(
  placementId: string,
  reason?: string
): Promise<{
  success: boolean;
  newPlacementCreated: boolean;
}> {
  const { profile } = await requireCompanyProfile();

  const result = await prisma.$transaction(async (tx) => {
    const placement = await tx.placement.findUnique({
      where: { id: placementId },
      include: {
        offer: true,
      },
    });

    if (!placement || placement.offer.companyId !== profile.id) {
      throw new Error("Plasamentul specificat nu a fost găsit sau nu aparține companiei dumneavoastră.");
    }

    // 1. Marcăm plasamentul ca anulat de către companie
    await tx.placement.update({
      where: { id: placementId },
      data: {
        status: PlacementStatus.CANCELLED_BY_COMPANY,
        cancelledAt: new Date(),
        cancelReason: reason?.trim() || null,
      },
    });

    // 2. Colectăm datele pentru realocare minimală
    const confirmedPlacementsDb = await tx.placement.findMany({
      where: {
        status: PlacementStatus.CONFIRMED,
        id: { not: placementId },
      },
      select: {
        studentId: true,
        offerId: true,
      },
    });

    const activeOffersDb = await tx.internshipOffer.findMany({
      where: { status: OfferStatus.ACTIVE },
      include: {
        applicantRanks: {
          orderBy: { rank: "asc" },
        },
      },
    });

    const offersInput: OfferPreferences[] = activeOffersDb.map((o) => ({
      offerId: o.id,
      capacity: o.slotsTotal,
      studentRanking: o.applicantRanks.map((r) => r.studentId),
    }));

    const studentsWithPrefs = await tx.studentProfile.findMany({
      where: {
        preferences: { some: {} },
      },
      include: {
        preferences: {
          orderBy: { rank: "asc" },
        },
      },
    });

    const studentsInput: StudentPreferences[] = studentsWithPrefs.map((s) => ({
      studentId: s.id,
      preferences: s.preferences.map((p) => p.offerId),
    }));

    const minimalResult = handleMinimalReallocation(
      confirmedPlacementsDb,
      {
        type: "STUDENT_REFUSED", // Efect identic: un loc devine liber la această ofertă
        studentId: placement.studentId,
        offerId: placement.offerId,
      },
      offersInput,
      studentsInput
    );

    let newPlacementCreated = false;
    if (minimalResult.newlyAssigned.length > 0) {
      const newMatch = minimalResult.newlyAssigned[0];
      await tx.placement.upsert({
        where: { studentId: newMatch.studentId },
        create: {
          studentId: newMatch.studentId,
          offerId: newMatch.offerId,
          status: PlacementStatus.PENDING_CONFIRMATION,
        },
        update: {
          offerId: newMatch.offerId,
          status: PlacementStatus.PENDING_CONFIRMATION,
          matchedAt: new Date(),
          cancelledAt: null,
          cancelReason: null,
        },
      });
      newPlacementCreated = true;
    }

    return { success: true, newPlacementCreated };
  });

  revalidatePath("/");
  return result;
}
