import prisma from "@/lib/prisma";
import { AuditActionType, Prisma } from "@prisma/client";

export interface LogAuditParams {
  actorId: string;
  actionType: AuditActionType;
  targetEntity: string;
  details?: Record<string, unknown> | Prisma.InputJsonValue;
}

/**
 * Înregistrează o acțiune administrativă sau critică în tabelul audit_logs.
 */
export async function logAuditEvent({
  actorId,
  actionType,
  targetEntity,
  details,
}: LogAuditParams) {
  try {
    const log = await prisma.auditLog.create({
      data: {
        actorId,
        actionType,
        targetEntity,
        details: (details ?? {}) as Prisma.InputJsonValue,
      },
    });
    return log;
  } catch (error) {
    console.error("Eroare la scrierea în AuditLog:", error);
    // Nu blocăm fluxul principal dacă audit logging-ul eșuează, dar returnăm null
    return null;
  }
}
