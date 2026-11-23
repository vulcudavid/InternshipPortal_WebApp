import { NextRequest, NextResponse } from "next/server";
import { checkAdminApiAuth } from "@/lib/admin-guard";
import prisma from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { AuditActionType, CompanyStatus, NotificationType } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ companyId: string }> }
) {
  const auth = await checkAdminApiAuth();
  if (auth.response) return auth.response;

  try {
    const { companyId } = await context.params;
    const body = await request.json();
    const { status } = body;

    if (!status || !Object.values(CompanyStatus).includes(status)) {
      return NextResponse.json(
        { error: "Status invalid. Valori permise: PENDING, APPROVED, REJECTED." },
        { status: 400 }
      );
    }

    const company = await prisma.companyProfile.findUnique({
      where: { id: companyId },
      include: { user: true },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Compania specificată nu a fost găsită." },
        { status: 404 }
      );
    }

    const previousStatus = company.status;

    const updatedCompany = await prisma.companyProfile.update({
      where: { id: companyId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const actionType =
      status === CompanyStatus.APPROVED
        ? AuditActionType.COMPANY_APPROVE
        : AuditActionType.COMPANY_REJECT;

    await logAuditEvent({
      actorId: auth.user!.id,
      actionType,
      targetEntity: `Company:${companyId}`,
      details: {
        companyName: company.companyName,
        cuiCif: company.cuiCif,
        previousStatus,
        newStatus: status,
      },
    });

    // Notificare către utilizatorul companiei
    const notificationTitle =
      status === CompanyStatus.APPROVED
        ? "Profilul companiei a fost aprobat"
        : status === CompanyStatus.REJECTED
        ? "Profilul companiei a fost respins"
        : "Statusul companiei a fost modificat";

    const notificationMessage =
      status === CompanyStatus.APPROVED
        ? `Felicitări! Profilul companiei ${company.companyName} a fost aprobat de administrator. Puteți publica oferte de practică.`
        : status === CompanyStatus.REJECTED
        ? `Profilul companiei ${company.companyName} a fost respins de administrator. Vă rugăm să contactați coordonatorii.`
        : `Statusul profilului a fost actualizat la ${status}.`;

    await createNotification({
      userId: company.userId,
      title: notificationTitle,
      message: notificationMessage,
      type: NotificationType.COMPANY_STATUS_CHANGED,
    });

    return NextResponse.json({
      message: `Statusul companiei ${company.companyName} a fost actualizat în ${status}.`,
      company: updatedCompany,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Eroare la actualizarea statusului companiei." },
      { status: 500 }
    );
  }
}
