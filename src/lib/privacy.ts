import { prisma } from "@/lib/prisma";

/**
 * Verifică dacă o companie are permisiunea legală (GDPR / Privacy Gate)
 * de a accesa CV-ul complet și datele de contact directe ale unui student.
 * 
 * REGULĂ DE SECURITATE STRICTĂ (P14):
 * O firmă poate accesa CV-ul și datele de contact ale unui student EXCLUSIV
 * dacă studentul a adăugat cel puțin o ofertă a acelei companii în preferințele sale
 * (StudentPreference). Dacă studentul nu a aplicat / nu a adăugat oferta în preferințe,
 * accesul este strict interzis.
 */
export async function canCompanyAccessStudentCv(
  companyProfileId: string,
  studentId: string,
  targetOfferId?: string
): Promise<boolean> {
  if (targetOfferId) {
    // Verifică dacă studentul a inclus oferta specifică în preferințele sale
    const preference = await prisma.studentPreference.findFirst({
      where: {
        offerId: targetOfferId,
        studentId: studentId,
        offer: {
          companyId: companyProfileId,
        },
      },
    });

    return !!preference;
  }

  // Verifică dacă studentul a adăugat oricare dintre ofertele acestei companii în preferințe
  const preference = await prisma.studentPreference.findFirst({
    where: {
      studentId: studentId,
      offer: {
        companyId: companyProfileId,
      },
    },
  });

  return !!preference;
}

/**
 * Filtrează / maschează datele private (CV, telefon) din profilul studentului
 * atunci când o firmă accesează lista generală de recomandări / feed-ul social.
 */
export function sanitizeStudentProfileForCompany<
  T extends {
    cvUrl?: string | null;
    phone?: string | null;
  }
>(studentProfile: T, canAccessDetails: boolean): T {
  if (canAccessDetails) {
    return studentProfile;
  }

  return {
    ...studentProfile,
    cvUrl: null,
    phone: null,
  };
}
