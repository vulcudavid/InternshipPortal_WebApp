import { NextRequest, NextResponse } from "next/server";
import { checkAdminApiAuth } from "@/lib/admin-guard";
import prisma from "@/lib/prisma";
import { OfferStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  const auth = await checkAdminApiAuth();
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");

    const whereClause: any = {};
    if (statusParam && Object.values(OfferStatus).includes(statusParam as OfferStatus)) {
      whereClause.status = statusParam as OfferStatus;
    }

    const offers = await prisma.internshipOffer.findMany({
      where: whereClause,
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            cuiCif: true,
            city: true,
            status: true,
          },
        },
        offerTags: {
          include: { tag: true },
        },
        _count: {
          select: {
            placements: true,
            preferences: true,
            applicantRanks: true,
          },
        },
        placements: {
          select: {
            id: true,
            status: true,
            studentId: true,
            cancelReason: true,
            student: {
              select: {
                id: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ offers });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Eroare la preluarea listei de oferte." },
      { status: 500 }
    );
  }
}
