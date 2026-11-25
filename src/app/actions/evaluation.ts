"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { UserRole, NotificationType, PlacementStatus } from "@prisma/client";

/**
 * Salvare / Actualizare Fișă de Evaluare Finală de către tutore
 */
export async function submitFinalEvaluation(params: {
  placementId: string;
  grade: number;
  feedback: string;
  competenciesAcquired: string[];
  evaluatorName: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Neautentificat.");

  const isCompany = user.role === UserRole.COMPANY_TUTOR && !!user.companyProfile;
  const isAdmin = user.role === UserRole.ADMIN;
  if (!isCompany && !isAdmin) {
    throw new Error("Acces neautorizat. Doar tutorele companiei sau administratorul poate completa fișa de evaluare finală.");
  }

  const { placementId, grade, feedback, competenciesAcquired, evaluatorName } = params;

  // Validare notă între 1 și 10
  const numGrade = Number(grade);
  if (isNaN(numGrade) || numGrade < 1 || numGrade > 10) {
    throw new Error("Nota finală acordată trebuie să fie între 1.0 și 10.0.");
  }

  // Validare feedback și evaluator
  const cleanFeedback = feedback?.trim();
  if (!cleanFeedback || cleanFeedback.length < 5) {
    throw new Error("Te rugăm să introduci o apreciere descriptivă a stagiului (minim 5 caractere).");
  }

  const cleanEvaluator = evaluatorName?.trim();
  if (!cleanEvaluator || cleanEvaluator.length < 2) {
    throw new Error("Numele evaluatorului este obligatoriu.");
  }

  const cleanCompetencies = Array.isArray(competenciesAcquired)
    ? competenciesAcquired.map((c) => c.trim()).filter((c) => c.length > 0)
    : [];

  // Verificare plasament
  const placement = await prisma.placement.findUnique({
    where: { id: placementId },
    include: {
      offer: true,
      student: {
        include: { user: true },
      },
    },
  });

  if (!placement) {
    throw new Error("Plasamentul specificat nu a fost găsit.");
  }

  if (isCompany && placement.offer.companyId !== user.companyProfile!.id) {
    throw new Error("Nu aveți permisiunea de a evalua studenții altei companii.");
  }

  if (placement.status !== PlacementStatus.CONFIRMED) {
    throw new Error("Evaluarea finală poate fi completată doar pentru plasamente confirmate.");
  }

  // Upsert FinalEvaluation
  const evaluation = await prisma.finalEvaluation.upsert({
    where: { placementId: placement.id },
    create: {
      placementId: placement.id,
      grade: numGrade,
      feedback: cleanFeedback,
      competenciesAcquired: cleanCompetencies,
      evaluatorName: cleanEvaluator,
      submittedAt: new Date(),
    },
    update: {
      grade: numGrade,
      feedback: cleanFeedback,
      competenciesAcquired: cleanCompetencies,
      evaluatorName: cleanEvaluator,
      submittedAt: new Date(),
    },
  });

  // Notificare student
  const studentUserId = placement.student.userId;
  await createNotification({
    userId: studentUserId,
    title: "Fișa de evaluare finală completată",
    message: `Tutorele ${cleanEvaluator} a completat fișa de evaluare finală a practicii pentru poziția '${placement.offer.title}', acordând nota ${numGrade.toFixed(1)}.`,
    type: NotificationType.SYSTEM_ALERT,
  });

  revalidatePath("/");
  return { success: true, evaluation };
}
