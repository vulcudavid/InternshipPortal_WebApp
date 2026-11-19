import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { generateConventionHtml } from "@/lib/conventions/template-html";
import { buildConventionData } from "@/lib/conventions/generator";
import { ConventionData } from "@/lib/conventions/types";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ conventionId: string }> }
) {
  const { conventionId } = await context.params;

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json(
      { error: "Autentificare necesară." },
      { status: 401 }
    );
  }

  const convention = await prisma.internshipConvention.findUnique({
    where: { id: conventionId },
    include: {
      placement: {
        include: {
          student: true,
          offer: { include: { company: true } },
        },
      },
    },
  });

  if (!convention) {
    return NextResponse.json(
      { error: "Convenția nu există." },
      { status: 404 }
    );
  }

  // Verificare RBAC
  let isAllowed = false;
  if (currentUser.role === UserRole.COORDINATOR || currentUser.role === UserRole.ADMIN) {
    isAllowed = true;
  } else if (currentUser.role === UserRole.STUDENT) {
    isAllowed = currentUser.studentProfile?.id === convention.placement.studentId;
  } else if (currentUser.role === UserRole.COMPANY_TUTOR) {
    isAllowed = currentUser.companyProfile?.id === convention.placement.offer.companyId;
  }

  if (!isAllowed) {
    return NextResponse.json(
      { error: "Acces interzis." },
      { status: 403 }
    );
  }

  let data: ConventionData;
  if (convention.prefilledData && typeof convention.prefilledData === "object" && Object.keys(convention.prefilledData).length > 0) {
    data = convention.prefilledData as unknown as ConventionData;
  } else {
    data = await buildConventionData(convention.placementId);
  }

  const html = generateConventionHtml(data);

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
