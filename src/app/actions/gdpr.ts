"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { anonymizeStudentProfile } from "@/lib/gdpr";

/**
 * Dreptul la Ștergere / Anonimizare conform Art. 17 GDPR.
 * Poate fi solicitat de studentul autentificat pentru a-și șterge datele cu caracter personal.
 */
export async function requestDataErasure(): Promise<{ success: boolean; message: string }> {
  const user = await getCurrentUser();

  if (!user || user.role !== UserRole.STUDENT || !user.studentProfile) {
    throw new Error("Acces neautorizat. Doar studenții autentificați pot solicita anonimizarea profilului.");
  }

  await anonymizeStudentProfile(user.studentProfile.id);

  revalidatePath("/");
  return {
    success: true,
    message: "Datele dumneavoastră personale au fost anonimizate ireversibil conform cerințelor GDPR (Art. 17). CV-ul a fost șters de pe server.",
  };
}
