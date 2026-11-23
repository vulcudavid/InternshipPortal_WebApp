import fs from "fs/promises";
import path from "path";
import { prisma } from "./prisma";

const PROJECT_ROOT = path.resolve(process.cwd());

/**
 * Anonimizează profilul unui student conform GDPR.
 * Șterge datele personale, dar păstrează înregistrarea Placement intactă.
 */
export async function anonymizeStudentProfile(studentId: string): Promise<void> {
  // 1. Citim profilul cu relaţia user
  const profile = await prisma.studentProfile.findUniqueOrThrow({
    where: { id: studentId },
    include: { user: true },
  });

  // 2. Ştergem fizic CV-ul dacă există (fără a arunca eroare dacă lipseşte)
  if (profile.cvUrl) {
    const filename = path.basename(profile.cvUrl);
    const candidatePaths = [
      path.join(PROJECT_ROOT, "storage", "cvs", filename),
      path.join(PROJECT_ROOT, "public", "uploads", "cvs", filename),
    ];
    for (const cvPath of candidatePaths) {
      try {
        await fs.unlink(cvPath);
      } catch {
        // fişierul nu există sau alt motiv — ignorăm
      }
    }
  }

  // 3. Actualizăm User
  await prisma.user.update({
    where: { id: profile.userId },
    data: {
      firstName: "Student",
      lastName: "[Anonimizat]",
      email: `gdpr-erased-${studentId}@anonymized.ulbsibiu.ro`,
      isActive: false,
      passwordHash: "ERASED",
    },
  });

  // 4. Actualizăm StudentProfile — ştergem datele personale
  await prisma.studentProfile.update({
    where: { id: studentId },
    data: {
      bio: null,
      headline: null,
      phone: null,
      cvUrl: null,
      githubUrl: null,
      linkedinUrl: null,
      portfolioUrl: null,
      gdprConsent: false,
      gdprConsentAt: null,
    },
  });

  // Placement rămâne intact — nu îl atingem
}
