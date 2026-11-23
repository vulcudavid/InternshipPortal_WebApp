import { NextRequest, NextResponse } from "next/server";
import { checkAdminApiAuth } from "@/lib/admin-guard";
import prisma from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { createNotification, notifyCoordinators } from "@/lib/notifications";
import {
  AuditActionType,
  OfferStatus,
  PlacementStatus,
  NotificationType,
} from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ offerId: string }> }
) {
  const auth = await checkAdminApiAuth();
  if (auth.response) return auth.response;

  try {
    const { offerId } = await context.params;
    const body = await request.json();
    const { status, reason } = body;

    if (!status || !Object.values(OfferStatus).includes(status)) {
      return NextResponse.json(
        { error: "Status invalid. Valori permise: DRAFT, ACTIVE, CLOSED." },
        { status: 400 }
      );
    }

    const offer = await prisma.internshipOffer.findUnique({
      where: { id: offerId },
      include: {
        company: true,
        placements: {
          where: {
            status: {
              in: [PlacementStatus.PENDING_CONFIRMATION, PlacementStatus.CONFIRMED],
            },
          },
          include: {
            student: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!offer) {
      return NextResponse.json(
        { error: "Oferta specificată nu a fost găsită." },
        { status: 404 }
      );
    }

    const previousStatus = offer.status;
    const isWithdrawing =
      previousStatus === OfferStatus.ACTIVE && status !== OfferStatus.ACTIVE;

    const cancelReasonText =
      reason || "Ofertă retrasă de Admin: necesită realocare minimală.";

    // Executare tranzacțională
    const result = await prisma.$transaction(async (tx) => {
      // 1. Actualizare status ofertă
      const updatedOffer = await tx.internshipOffer.update({
        where: { id: offerId },
        data: { status },
      });

      let affectedPlacements: typeof offer.placements = [];

      // 2. Twist P14: Dacă oferta a fost retrasă/dezactivată, trecem studenții în NEPLASAT
      if (isWithdrawing && offer.placements.length > 0) {
        affectedPlacements = offer.placements;

        await tx.placement.updateMany({
          where: {
            offerId,
            status: {
              in: [PlacementStatus.PENDING_CONFIRMATION, PlacementStatus.CONFIRMED],
            },
          },
          data: {
            status: PlacementStatus.NEPLASAT,
            cancelledAt: new Date(),
            cancelReason: cancelReasonText,
          },
        });
      }

      return { updatedOffer, affectedPlacements };
    });

    // 3. Notificări & Audit Log
    if (isWithdrawing) {
      // Notificăm fiecare student afectat
      for (const placement of result.affectedPlacements) {
        await createNotification({
          userId: placement.student.userId,
          title: "Ofertă de practică retrasă de Administrator",
          message: `Oferta '${offer.title}' (compania ${offer.company.companyName}) la care ai fost repartizat a fost retrasă de către administrator. Statusul tău este acum NEPLASAT și ai fost marcat pentru realocare minimală de către Coordonatorul de practică.`,
          type: NotificationType.OFFER_WITHDRAWN,
        });
      }

      // Notificăm toți coordonatorii de practică
      await notifyCoordinators({
        title: "Alertă Sistem: Ofertă retrasă de Admin - Realocare necesară",
        message: `Oferta '${offer.title}' a firmei ${offer.company.companyName} a fost retrasă de către administrator. ${result.affectedPlacements.length} student(i) au fost trecuți în status NEPLASAT și necesită realocare minimală fără re-rularea completă a algoritmului Gale-Shapley.`,
        type: NotificationType.OFFER_WITHDRAWN,
      });

      await logAuditEvent({
        actorId: auth.user!.id,
        actionType: AuditActionType.OFFER_WITHDRAW,
        targetEntity: `Offer:${offerId}`,
        details: {
          offerTitle: offer.title,
          companyName: offer.company.companyName,
          previousStatus,
          newStatus: status,
          reason: cancelReasonText,
          affectedStudentsCount: result.affectedPlacements.length,
          affectedStudentIds: result.affectedPlacements.map((p) => p.studentId),
        },
      });
    } else {
      await logAuditEvent({
        actorId: auth.user!.id,
        actionType:
          status === OfferStatus.ACTIVE
            ? AuditActionType.OFFER_ACTIVATE
            : AuditActionType.SETTINGS_UPDATE,
        targetEntity: `Offer:${offerId}`,
        details: {
          offerTitle: offer.title,
          previousStatus,
          newStatus: status,
        },
      });
    }

    return NextResponse.json({
      message: isWithdrawing
        ? `Oferta '${offer.title}' a fost retrasă. ${result.affectedPlacements.length} student(i) au fost trecuți în status NEPLASAT pentru realocare minimală.`
        : `Statusul ofertei '${offer.title}' a fost actualizat la ${status}.`,
      offer: result.updatedOffer,
      affectedPlacementsCount: result.affectedPlacements.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Eroare la actualizarea statusului ofertei." },
      { status: 500 }
    );
  }
}
