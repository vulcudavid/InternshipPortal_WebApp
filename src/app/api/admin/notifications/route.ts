import { NextRequest, NextResponse } from "next/server";
import { checkAdminApiAuth } from "@/lib/admin-guard";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await checkAdminApiAuth();
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

    const whereClause: any = {};
    if (userIdParam) {
      whereClause.userId = userIdParam;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ notifications });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Eroare la preluarea notificărilor." },
      { status: 500 }
    );
  }
}
