"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { UserRole, PlacementStatus, OfferStatus, ConventionStatus } from "@prisma/client";
import { runGaleShapley, OfferPreferences, StudentPreferences } from "@/lib/matching";
import { revalidatePath } from "next/cache";

/**
 * Guard intern pentru verificarea accesului rolului COORDINATOR
 */
export async function requireCoordinatorProfile() {
  const user = await getCurrentUser();

  if (!user || user.role !== UserRole.COORDINATOR) {
    throw new Error("Acces neautorizat. Doar coordonatorii academici pot accesa aceste funcționalități.");
  }

  return { user };
}

export type CoordinatorDashboardData = Awaited<ReturnType<typeof getCoordinatorDashboardData>>;

/**
 * 1. Orchestrare Algoritm Gale-Shapley (Many-to-One)
 * Exclude studenții deja CONFIRMED (D-005) și creează plasamente în PENDING_CONFIRMATION
 */
export async function runMatchingAction(): Promise<{
  created: number;
  updated: number;
  unassigned: string[];
}> {
  await requireCoordinatorProfile();

  // a. Citește studenții cu preferințe ordonate
  const studentsWithPrefs = await prisma.studentProfile.findMany({
    where: {
      preferences: { some: {} },
    },
    include: {
      preferences: {
        orderBy: { rank: "asc" },
      },
    },
  });

  // b. Citește studenții deja confirmați (D-005: înghețați, nu sunt atinși de re-rulare)
  const confirmedPlacements = await prisma.placement.findMany({
    where: { status: PlacementStatus.CONFIRMED },
    select: { studentId: true, offerId: true },
  });

  const frozenStudentIds = new Set(confirmedPlacements.map((cp) => cp.studentId));

  // Capacități deja ocupate de studenții confirmați
  const confirmedCountPerOffer = new Map<string, number>();
  for (const cp of confirmedPlacements) {
    confirmedCountPerOffer.set(cp.offerId, (confirmedCountPerOffer.get(cp.offerId) || 0) + 1);
  }

  // c. Filtrează studenții eligibili pentru această rundă
  const eligibleStudents = studentsWithPrefs.filter((s) => !frozenStudentIds.has(s.id));
  const studentsInput: StudentPreferences[] = eligibleStudents.map((s) => ({
    studentId: s.id,
    preferences: s.preferences.map((p) => p.offerId),
  }));

  // d. Citește ofertele active și clasamentele lor
  const activeOffers = await prisma.internshipOffer.findMany({
    where: { status: OfferStatus.ACTIVE },
    include: {
      applicantRanks: {
        orderBy: { rank: "asc" },
      },
    },
  });

  const offersInput: OfferPreferences[] = activeOffers.map((offer) => {
    const alreadyConfirmed = confirmedCountPerOffer.get(offer.id) || 0;
    const remainingCapacity = Math.max(0, offer.slotsTotal - alreadyConfirmed);
    const eligibleRanking = offer.applicantRanks
      .map((r) => r.studentId)
      .filter((sId) => !frozenStudentIds.has(sId));

    return {
      offerId: offer.id,
      capacity: remainingCapacity,
      studentRanking: eligibleRanking,
    };
  });

  // e. Rulare Gale-Shapley (Deferred Acceptance)
  const result = runGaleShapley(studentsInput, offersInput);

  // f. Persistență tranzacțională în DB
  let created = 0;
  let updated = 0;

  await prisma.$transaction(async (tx) => {
    for (const alloc of result.allocations) {
      const existing = await tx.placement.findUnique({
        where: { studentId: alloc.studentId },
      });

      if (existing) {
        // Dacă nu este CONFIRMED, îl actualizăm cu noul rezultat
        if (existing.status !== PlacementStatus.CONFIRMED) {
          await tx.placement.update({
            where: { studentId: alloc.studentId },
            data: {
              offerId: alloc.offerId,
              status: PlacementStatus.PENDING_CONFIRMATION,
              matchedAt: new Date(),
              cancelledAt: null,
              cancelReason: null,
            },
          });
          updated++;
        }
      } else {
        await tx.placement.create({
          data: {
            studentId: alloc.studentId,
            offerId: alloc.offerId,
            status: PlacementStatus.PENDING_CONFIRMATION,
            matchedAt: new Date(),
          },
        });
        created++;
      }
    }
  });

  revalidatePath("/");
  return {
    created,
    updated,
    unassigned: result.unassignedStudents,
  };
}

/**
 * 2. Confirmare Individuală Plasament (PENDING_CONFIRMATION -> CONFIRMED)
 */
export async function confirmPlacement(placementId: string): Promise<{ success: boolean }> {
  await requireCoordinatorProfile();

  const placement = await prisma.placement.findUnique({
    where: { id: placementId },
  });

  if (!placement) {
    throw new Error("Plasamentul specificat nu a fost găsit.");
  }

  if (placement.status !== PlacementStatus.PENDING_CONFIRMATION) {
    throw new Error("Doar plasamentele în așteptare de confirmare (PENDING_CONFIRMATION) pot fi confirmate.");
  }

  await prisma.placement.update({
    where: { id: placementId },
    data: {
      status: PlacementStatus.CONFIRMED,
      confirmedAt: new Date(),
    },
  });

  revalidatePath("/");
  return { success: true };
}

/**
 * 3. Confirmare în Masă (Bulk Confirm) a tuturor plasamentelor PENDING
 */
export async function confirmAllPlacements(): Promise<{ confirmed: number }> {
  await requireCoordinatorProfile();

  const updateResult = await prisma.placement.updateMany({
    where: {
      status: PlacementStatus.PENDING_CONFIRMATION,
    },
    data: {
      status: PlacementStatus.CONFIRMED,
      confirmedAt: new Date(),
    },
  });

  revalidatePath("/");
  return { confirmed: updateResult.count };
}

/**
 * 4. Anulare Plasament de către Coordonator (D-005)
 */
export async function cancelPlacementByCoordinator(
  placementId: string,
  reason?: string
): Promise<{ success: boolean }> {
  await requireCoordinatorProfile();

  const placement = await prisma.placement.findUnique({
    where: { id: placementId },
  });

  if (!placement) {
    throw new Error("Plasamentul specificat nu a fost găsit.");
  }

  await prisma.placement.update({
    where: { id: placementId },
    data: {
      status: PlacementStatus.CANCELLED_BY_COORDINATOR,
      cancelledAt: new Date(),
      cancelReason: reason?.trim() || null,
    },
  });

  revalidatePath("/");
  return { success: true };
}

/**
 * 5. Colectare Date Dashboard Coordonator (Statistici KPI & Istoric Plasamente)
 */
export async function getCoordinatorDashboardData() {
  await requireCoordinatorProfile();

  // Data de luni ora 00:00:00 a săptămânii curente
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 este duminică
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const [
    totalEligibleStudents,
    placementsGrouped,
    activePlacedCount,
    conventionsMissing,
    workLogsThisWeek,
    recentPlacements,
  ] = await Promise.all([
    // Studenți cu cel puțin o preferință de practică
    prisma.studentProfile.count({
      where: { preferences: { some: {} } },
    }),
    // Grup per status pe Placement
    prisma.placement.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    // Studenți cu plasament activ (CONFIRMED sau PENDING_CONFIRMATION)
    prisma.placement.count({
      where: {
        status: { in: [PlacementStatus.CONFIRMED, PlacementStatus.PENDING_CONFIRMATION] },
      },
    }),
    // Plasamente CONFIRMED care nu au convenție sau sunt încă nesemnate/neaprobate
    prisma.placement.count({
      where: {
        status: PlacementStatus.CONFIRMED,
        OR: [
          { convention: null },
          {
            convention: {
              status: {
                in: [ConventionStatus.DRAFT, ConventionStatus.GENERATED],
              },
            },
          },
        ],
      },
    }),
    // Jurnale de practică create în săptămâna curentă
    prisma.workLog.count({
      where: {
        createdAt: { gte: startOfWeek },
      },
    }),
    // Ultimele plasamente
    prisma.placement.findMany({
      take: 50,
      orderBy: { updatedAt: "desc" },
      include: {
        student: {
          select: {
            id: true,
            specialization: true,
            studyYear: true,
            group: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        offer: {
          select: {
            id: true,
            title: true,
            company: {
              select: {
                companyName: true,
              },
            },
          },
        },
        convention: {
          select: {
            id: true,
            status: true,
            conventionNumber: true,
            generatedPdfUrl: true,
            signedPdfUrl: true,
            signedAt: true,
            approvedAt: true,
          },
        },
      },
    }),
  ]);

  let totalConfirmed = 0;
  let totalPending = 0;
  let totalCancelled = 0;

  for (const item of placementsGrouped) {
    if (item.status === PlacementStatus.CONFIRMED) {
      totalConfirmed += item._count.id;
    } else if (item.status === PlacementStatus.PENDING_CONFIRMATION) {
      totalPending += item._count.id;
    } else if (
      item.status === PlacementStatus.CANCELLED_BY_COMPANY ||
      item.status === PlacementStatus.CANCELLED_BY_COORDINATOR ||
      item.status === PlacementStatus.REFUSED_BY_STUDENT
    ) {
      totalCancelled += item._count.id;
    }
  }

  const totalUnplaced = Math.max(0, totalEligibleStudents - activePlacedCount);

  return {
    stats: {
      totalEligibleStudents,
      totalConfirmed,
      totalPending,
      totalUnplaced,
      totalCancelled,
      conventionsMissing,
      workLogsThisWeek,
    },
    recentPlacements: recentPlacements.map((p) => ({
      id: p.id,
      status: p.status,
      matchedAt: p.matchedAt,
      confirmedAt: p.confirmedAt,
      cancelledAt: p.cancelledAt,
      cancelReason: p.cancelReason,
      student: {
        id: p.student.id,
        specialization: p.student.specialization,
        studyYear: p.student.studyYear,
        group: p.student.group,
        user: {
          firstName: p.student.user.firstName,
          lastName: p.student.user.lastName,
        },
      },
      offer: {
        id: p.offer.id,
        title: p.offer.title,
        company: {
          companyName: p.offer.company.companyName,
        },
      },
    })),
  };
}

/**
 * 6. Export Date Plasamente în format CSV (fără date personale de contact GDPR)
 */
export async function exportPlacementsCsv(): Promise<{
  csv: string;
  filename: string;
}> {
  await requireCoordinatorProfile();

  const placements = await prisma.placement.findMany({
    orderBy: { matchedAt: "desc" },
    include: {
      student: {
        select: {
          specialization: true,
          studyYear: true,
          group: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      offer: {
        select: {
          title: true,
          company: {
            select: {
              companyName: true,
            },
          },
        },
      },
    },
  });

  const escapeCsv = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = [
    "placement_id",
    "student_name",
    "specialization",
    "study_year",
    "group",
    "company_name",
    "offer_title",
    "status",
    "matched_at",
    "confirmed_at",
  ];

  const rows = placements.map((p) => [
    escapeCsv(p.id),
    escapeCsv(`${p.student.user.firstName} ${p.student.user.lastName}`),
    escapeCsv(p.student.specialization),
    escapeCsv(p.student.studyYear),
    escapeCsv(p.student.group),
    escapeCsv(p.offer.company.companyName),
    escapeCsv(p.offer.title),
    escapeCsv(p.status),
    escapeCsv(p.matchedAt.toISOString()),
    escapeCsv(p.confirmedAt ? p.confirmedAt.toISOString() : ""),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const filename = `plasamente-${new Date().toISOString().slice(0, 10)}.csv`;

  return { csv, filename };
}
