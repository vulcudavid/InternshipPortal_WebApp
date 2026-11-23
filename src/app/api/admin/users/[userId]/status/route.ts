import { NextRequest, NextResponse } from "next/server";
import { checkAdminApiAuth } from "@/lib/admin-guard";
import prisma from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { AuditActionType } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const auth = await checkAdminApiAuth();
  if (auth.response) return auth.response;

  try {
    const { userId } = await context.params;
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "Câmpul 'isActive' trebuie să fie de tip boolean (true sau false)." },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Utilizatorul specificat nu a fost găsit." },
        { status: 404 }
      );
    }

    // Prevenire auto-dezactivare a adminului autentificat
    if (targetUser.id === auth.user!.id && !isActive) {
      return NextResponse.json(
        { error: "Nu vă puteți dezactiva propriul cont de administrator." },
        { status: 400 }
      );
    }

    const previousStatus = targetUser.isActive;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    await logAuditEvent({
      actorId: auth.user!.id,
      actionType: AuditActionType.USER_STATUS_CHANGE,
      targetEntity: `User:${userId}`,
      details: {
        previousStatus,
        newStatus: isActive,
        userEmail: targetUser.email,
      },
    });

    return NextResponse.json({
      message: `Contul ${targetUser.email} este acum ${isActive ? "activ" : "inactiv"}.`,
      user: updatedUser,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Eroare la modificarea statusului utilizatorului." },
      { status: 500 }
    );
  }
}
