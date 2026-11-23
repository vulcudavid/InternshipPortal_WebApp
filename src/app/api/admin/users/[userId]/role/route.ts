import { NextRequest, NextResponse } from "next/server";
import { checkAdminApiAuth } from "@/lib/admin-guard";
import prisma from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { AuditActionType, UserRole, EngineeringDomain } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const auth = await checkAdminApiAuth();
  if (auth.response) return auth.response;

  try {
    const { userId } = await context.params;
    const body = await request.json();
    const { role } = body;

    if (!role || !Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { error: "Rol invalid. Valori permise: STUDENT, COMPANY_TUTOR, COORDINATOR, ADMIN." },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true,
        companyProfile: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Utilizatorul specificat nu a fost găsit." },
        { status: 404 }
      );
    }

    // Prevenire auto-demotare a adminului conectat
    if (targetUser.id === auth.user!.id && role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Nu vă puteți retrage propriul rol de administrator." },
        { status: 400 }
      );
    }

    // Prevenire demotare ultimul admin din sistem
    if (targetUser.role === UserRole.ADMIN && role !== UserRole.ADMIN) {
      const activeAdminCount = await prisma.user.count({
        where: { role: UserRole.ADMIN, isActive: true },
      });
      if (activeAdminCount <= 1) {
        return NextResponse.json(
          { error: "Nu puteți schimba rolul ultimului administrator activ din sistem." },
          { status: 400 }
        );
      }
    }

    const previousRole = targetUser.role;

    // Actualizăm utilizatorul și creăm profil implicit dacă trece la Student sau Companie și nu avea profil
    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { role },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
        },
      });

      if (role === UserRole.STUDENT && !targetUser.studentProfile) {
        await tx.studentProfile.create({
          data: {
            userId: user.id,
            faculty: "Facultatea de Inginerie ULBS",
            specialization: "Calculatoare",
            studyYear: 3,
            group: "Grupa 331",
            domain: EngineeringDomain.COMPUTER_SCIENCE_IT,
          },
        });
      } else if (role === UserRole.COMPANY_TUTOR && !targetUser.companyProfile) {
        await tx.companyProfile.create({
          data: {
            userId: user.id,
            companyName: `${user.lastName} Partner SRL`,
            cuiCif: `RO${Date.now().toString().slice(-8)}`,
            city: "Sibiu",
            address: "Str. Principală",
          },
        });
      }

      return user;
    });

    await logAuditEvent({
      actorId: auth.user!.id,
      actionType: AuditActionType.USER_ROLE_CHANGE,
      targetEntity: `User:${userId}`,
      details: {
        previousRole,
        newRole: role,
        userEmail: targetUser.email,
      },
    });

    return NextResponse.json({
      message: `Rolul utilizatorului ${targetUser.email} a fost schimbat din ${previousRole} în ${role}.`,
      user: updatedUser,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Eroare la schimbarea rolului de utilizator." },
      { status: 500 }
    );
  }
}
