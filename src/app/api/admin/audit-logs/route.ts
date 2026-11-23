import { NextRequest, NextResponse } from "next/server";
import { checkAdminApiAuth } from "@/lib/admin-guard";
import prisma from "@/lib/prisma";
import { AuditActionType } from "@prisma/client";

export async function GET(request: NextRequest) {
  const auth = await checkAdminApiAuth();
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const actionParam = searchParams.get("actionType");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

    const whereClause: any = {};
    if (actionParam && Object.values(AuditActionType).includes(actionParam as AuditActionType)) {
      whereClause.actionType = actionParam as AuditActionType;
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: whereClause,
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    return NextResponse.json({ auditLogs });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Eroare la preluarea înregistrărilor de audit." },
      { status: 500 }
    );
  }
}
