import { NextRequest, NextResponse } from "next/server";
import { checkAdminApiAuth } from "@/lib/admin-guard";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  const auth = await checkAdminApiAuth();
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const roleParam = searchParams.get("role");
    const searchParam = searchParams.get("search");
    const activeParam = searchParams.get("isActive");

    const whereClause: any = {};

    if (roleParam && Object.values(UserRole).includes(roleParam as UserRole)) {
      whereClause.role = roleParam as UserRole;
    }

    if (activeParam !== null && activeParam !== undefined && activeParam !== "") {
      whereClause.isActive = activeParam === "true";
    }

    if (searchParam) {
      whereClause.OR = [
        { email: { contains: searchParam, mode: "insensitive" } },
        { firstName: { contains: searchParam, mode: "insensitive" } },
        { lastName: { contains: searchParam, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        studentProfile: {
          select: {
            id: true,
            specialization: true,
            studyYear: true,
            group: true,
            domain: true,
          },
        },
        companyProfile: {
          select: {
            id: true,
            companyName: true,
            cuiCif: true,
            city: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Eroare la obținerea listei de utilizatori." },
      { status: 500 }
    );
  }
}
