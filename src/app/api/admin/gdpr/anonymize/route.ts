import { NextRequest, NextResponse } from "next/server";
import { checkAdminApiAuth } from "@/lib/admin-guard";
import prisma from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { AuditActionType } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

const PROJECT_ROOT = path.resolve(process.cwd());

export async function POST(request: NextRequest) {
  const auth = await checkAdminApiAuth();
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const { studentId, userId } = body;

    if (!studentId && !userId) {
      return NextResponse.json(
        { error: "Trebuie furnizat 'studentId' sau 'userId' pentru anonimizare." },
        { status: 400 }
      );
    }

    const studentProfile = await prisma.studentProfile.findFirst({
      where: {
        OR: [
          studentId ? { id: studentId } : undefined,
          userId ? { userId } : undefined,
        ].filter(Boolean) as any,
      },
      include: {
        user: true,
      },
    });

    if (!studentProfile) {
      return NextResponse.json(
        { error: "Profilul de student nu a fost găsit." },
        { status: 404 }
      );
    }

    const previousEmail = studentProfile.user.email;
    const targetStudentId = studentProfile.id;
    const targetUserId = studentProfile.userId;

    // 1. Ștergere fizică a CV-ului de pe disc dacă există
    if (studentProfile.cvUrl) {
      const filename = path.basename(studentProfile.cvUrl);
      const candidatePaths = [
        path.join(PROJECT_ROOT, "storage", "cvs", filename),
        path.join(PROJECT_ROOT, "public", "uploads", "cvs", filename),
      ];
      for (const cvPath of candidatePaths) {
        try {
          await fs.unlink(cvPath);
        } catch {
          // fișierul nu există sau a fost deja șters
        }
      }
    }

    // 2. Anonimizare în baza de date conform cerințelor:
    // nume -> Student_Anonim_<id>, email -> anonim_<id>@deleted.local, telefon/alte date -> null
    // păstrând intacte înregistrările de plasament, orele validate și statisticile agregate.
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: targetUserId },
        data: {
          firstName: `Student_Anonim_${targetStudentId}`,
          lastName: "",
          email: `anonim_${targetStudentId}@deleted.local`,
          passwordHash: "ERASED_GDPR",
          isActive: false,
        },
      });

      await tx.studentProfile.update({
        where: { id: targetStudentId },
        data: {
          phone: null,
          bio: null,
          headline: null,
          cvUrl: null,
          githubUrl: null,
          linkedinUrl: null,
          portfolioUrl: null,
          gdprConsent: false,
          gdprConsentAt: null,
        },
      });
    });

    // 3. Jurnal de Audit
    await logAuditEvent({
      actorId: auth.user!.id,
      actionType: AuditActionType.GDPR_ANONYMIZE,
      targetEntity: `StudentProfile:${targetStudentId}`,
      details: {
        targetUserId,
        studentId: targetStudentId,
        previousEmailMasked: `${previousEmail.slice(0, 2)}***@${previousEmail.split("@")[1]}`,
        anonymizedEmail: `anonim_${targetStudentId}@deleted.local`,
        anonymizedName: `Student_Anonim_${targetStudentId}`,
      },
    });

    return NextResponse.json({
      message: `Datele studentului au fost anonimizate ireversibil conform GDPR. Noul identificator: Student_Anonim_${targetStudentId}.`,
      studentId: targetStudentId,
      anonymizedName: `Student_Anonim_${targetStudentId}`,
      anonymizedEmail: `anonim_${targetStudentId}@deleted.local`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Eroare la executarea cererii de anonimizare GDPR." },
      { status: 500 }
    );
  }
}
