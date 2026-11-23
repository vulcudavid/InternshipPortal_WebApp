import { NextRequest, NextResponse } from "next/server";
import { checkAdminApiAuth } from "@/lib/admin-guard";
import { getSystemSettings, updateSystemSettings } from "@/lib/settings";
import { logAuditEvent } from "@/lib/audit";
import { AuditActionType, TieBreakerRule } from "@prisma/client";

export async function GET() {
  const auth = await checkAdminApiAuth();
  if (auth.response) return auth.response;

  try {
    const settings = await getSystemSettings();
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Eroare la preluarea setărilor de sistem." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await checkAdminApiAuth();
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const { requiredHours, tieBreakerRule } = body;

    const previousSettings = await getSystemSettings();

    const updated = await updateSystemSettings({
      requiredHours: requiredHours !== undefined ? Number(requiredHours) : undefined,
      tieBreakerRule: tieBreakerRule as TieBreakerRule | undefined,
    });

    await logAuditEvent({
      actorId: auth.user!.id,
      actionType: AuditActionType.SETTINGS_UPDATE,
      targetEntity: `SystemSettings:${updated.id}`,
      details: {
        previous: {
          requiredHours: previousSettings.requiredHours,
          tieBreakerRule: previousSettings.tieBreakerRule,
        },
        updated: {
          requiredHours: updated.requiredHours,
          tieBreakerRule: updated.tieBreakerRule,
        },
      },
    });

    return NextResponse.json({
      message: "Setările globale au fost actualizate cu succes.",
      settings: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Eroare la actualizarea setărilor globale." },
      { status: 400 }
    );
  }
}
