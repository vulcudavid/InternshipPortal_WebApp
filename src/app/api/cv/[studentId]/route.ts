import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canCompanyAccessStudentCv } from "@/lib/privacy";
import { getPrivateCvPath } from "@/lib/storage";
import { UserRole } from "@prisma/client";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await context.params;

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json(
      { error: "Autentificare necesară pentru a accesa acest CV." },
      { status: 401 }
    );
  }

  // 1. Verificare permisiuni conform contractului Privacy Gate
  let isAllowed = false;

  if (currentUser.role === UserRole.COORDINATOR || currentUser.role === UserRole.ADMIN) {
    isAllowed = true;
  } else if (currentUser.role === UserRole.STUDENT) {
    // Studentul are acces garantat la propriul CV
    isAllowed = currentUser.studentProfile?.id === studentId;
  } else if (currentUser.role === UserRole.COMPANY_TUTOR) {
    if (currentUser.companyProfile) {
      isAllowed = await canCompanyAccessStudentCv(currentUser.companyProfile.id, studentId);
    }
  }

  if (!isAllowed) {
    return NextResponse.json(
      {
        error:
          "Acces restricționat (Privacy Gate): Compania nu are dreptul de a vizualiza CV-ul acestui student deoarece acesta nu a aplicat și nu a exprimat nicio preferință pentru ofertele acesteia.",
      },
      { status: 403 }
    );
  }

  // 2. Extragere profil student și cvUrl
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    select: { cvUrl: true, user: { select: { firstName: true, lastName: true } } },
  });

  if (!studentProfile || !studentProfile.cvUrl) {
    return NextResponse.json(
      { error: "Studentul specificat nu are un CV încărcat sau profilul nu există." },
      { status: 404 }
    );
  }

  const cvUrl = studentProfile.cvUrl;

  // Dacă este un link extern (ex. Google Drive, LinkedIn, cloud etc.)
  if (cvUrl.startsWith("http://") || cvUrl.startsWith("https://")) {
    return NextResponse.redirect(cvUrl);
  }

  const filename = path.basename(cvUrl);
  const candidatePaths = [
    getPrivateCvPath(filename),
    path.join(process.cwd(), "public", "uploads", "cvs", filename),
    path.join(process.cwd(), "public", cvUrl.replace(/^\//, "")),
  ];

  for (const filePath of candidatePaths) {
    try {
      const fileBuffer = await fs.readFile(filePath);
      return new Response(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="CV_${studentProfile.user.lastName}_${studentProfile.user.firstName}.pdf"`,
        },
      });
    } catch {
      // Încercăm următoarea cale candidată
    }
  }

  return NextResponse.json(
    { error: "Fișierul CV nu a fost găsit pe server." },
    { status: 404 }
  );
}
