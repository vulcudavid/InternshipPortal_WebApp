import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { getConventionPath, getSignedConventionPath } from "@/lib/storage";
import { generateConventionPdf } from "@/lib/conventions/generator";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ conventionId: string }> }
) {
  const { conventionId } = await context.params;

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json(
      { error: "Autentificare necesară pentru descărcarea convenției." },
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
      { error: "Convenția specificată nu există." },
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
      { error: "Acces interzis: nu aveți permisiunea de a descărca această convenție." },
      { status: 403 }
    );
  }

  // Verificăm dacă utilizatorul dorește fișierul semnat sau cel generat
  const url = new URL(req.url);
  const preferSigned = url.searchParams.get("signed") === "true";

  let filePath: string | null = null;
  let contentType = "application/pdf";

  if (preferSigned && convention.signedPdfUrl) {
    filePath = getSignedConventionPath(path.basename(convention.signedPdfUrl));
    if (convention.signedPdfUrl.endsWith(".png")) contentType = "image/png";
    if (convention.signedPdfUrl.endsWith(".jpg") || convention.signedPdfUrl.endsWith(".jpeg")) contentType = "image/jpeg";
  } else if (convention.generatedPdfUrl) {
    filePath = getConventionPath(path.basename(convention.generatedPdfUrl));
  } else if (convention.signedPdfUrl) {
    filePath = getSignedConventionPath(path.basename(convention.signedPdfUrl));
  }

  let fileBuffer: Buffer | null = null;

  if (filePath) {
    try {
      fileBuffer = await fs.readFile(filePath);
    } catch {
      fileBuffer = null;
    }
  }

  // Fallback nativ garantat: dacă fișierul generat lipsește de pe disc, îl regenerăm pe loc
  if (!fileBuffer && (!preferSigned || !convention.signedPdfUrl)) {
    try {
      const generated = await generateConventionPdf(convention.placementId);
      fileBuffer = await fs.readFile(generated.pdfPath);
      contentType = "application/pdf";
    } catch (err: any) {
      console.error("Eroare la regenerarea automată a PDF-ului:", err);
    }
  }

  if (!fileBuffer) {
    return NextResponse.json(
      { error: "Fișierul convenției nu a putut fi găsit sau generat." },
      { status: 404 }
    );
  }

  const safeNum = convention.conventionNumber.replace(/[^a-zA-Z0-9_-]/g, "_");

  return new Response(fileBuffer as any, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="Conventie_${safeNum}.pdf"`,
    },
  });
}
