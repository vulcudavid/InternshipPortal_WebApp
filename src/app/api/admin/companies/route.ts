import { NextRequest, NextResponse } from "next/server";
import { checkAdminApiAuth } from "@/lib/admin-guard";
import prisma from "@/lib/prisma";
import { CompanyStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  const auth = await checkAdminApiAuth();
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");

    const whereClause: any = {};
    if (statusParam && Object.values(CompanyStatus).includes(statusParam as CompanyStatus)) {
      whereClause.status = statusParam as CompanyStatus;
    }

    const companies = await prisma.companyProfile.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
          },
        },
        _count: {
          select: { offers: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ companies });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Eroare la preluarea listei de companii." },
      { status: 500 }
    );
  }
}
