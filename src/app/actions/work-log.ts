"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { UserRole, WorkLogStatus, NotificationType, PlacementStatus } from "@prisma/client";

/**
 * 1. Adăugare intrare nouă în jurnalul de practică de către student
 */
export async function createWorkLog(params: {
  placementId: string;
  date: string;
  hoursWorked: number;
  activitySummary: string;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.STUDENT || !user.studentProfile) {
    throw new Error("Acces neautorizat. Doar studenții pot adăuga pontaje de practică.");
  }

  const { placementId, date, hoursWorked, activitySummary } = params;

  // Validare ore lucrate (între 1 și 12 ore pe zi)
  const hours = Number(hoursWorked);
  if (!Number.isInteger(hours) || hours <= 0 || hours > 12) {
    throw new Error("Numărul de ore lucrate trebuie să fie un număr întreg între 1 și 12.");
  }

  // Validare rezumat activitate
  const summary = activitySummary?.trim();
  if (!summary || summary.length < 5) {
    throw new Error("Te rugăm să introduci un rezumat descriptiv al activității (minim 5 caractere).");
  }

  // Validare dată
  const logDate = new Date(date);
  if (isNaN(logDate.getTime())) {
    throw new Error("Data introdusă este invalidă.");
  }

  // Verificare existență și apartenență plasament
  const placement = await prisma.placement.findUnique({
    where: { id: placementId },
    include: {
      offer: {
        include: {
          company: {
            include: { user: true },
          },
        },
      },
    },
  });

  if (!placement || placement.studentId !== user.studentProfile.id) {
    throw new Error("Plasamentul specificat nu aparține studentului conectat.");
  }

  if (
    placement.status !== PlacementStatus.CONFIRMED &&
    placement.status !== PlacementStatus.PENDING_CONFIRMATION
  ) {
    throw new Error("Poți adăuga intrări de pontaj doar pentru un plasament activ sau confirmat.");
  }

  // Creare WorkLog în baza de date
  const workLog = await prisma.workLog.create({
    data: {
      placementId: placement.id,
      date: logDate,
      hoursWorked: hours,
      activitySummary: summary,
      status: WorkLogStatus.PENDING,
    },
  });

  // Notificare tutore / reprezentant companie
  const tutorUserId = placement.offer.company.userId;
  const formattedDate = logDate.toLocaleDateString("ro-RO");
  await createNotification({
    userId: tutorUserId,
    title: "Pontaj nou în jurnalul de practică",
    message: `Studentul ${user.firstName} ${user.lastName} a înregistrat ${hours} ore de activitate pentru data de ${formattedDate} (${placement.offer.title}). Necesită validare.`,
    type: NotificationType.SYSTEM_ALERT,
  });

  revalidatePath("/");
  return { success: true, workLog };
}

/**
 * 2. Validare intrare pontaj de către tutorele de practică
 */
export async function validateWorkLog(workLogId: string, feedback?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Neautentificat.");

  const isCompany = user.role === UserRole.COMPANY_TUTOR && !!user.companyProfile;
  const isAdmin = user.role === UserRole.ADMIN;
  if (!isCompany && !isAdmin) {
    throw new Error("Acces neautorizat. Doar tutorele companiei sau administratorul poate valida pontajul.");
  }

  const workLog = await prisma.workLog.findUnique({
    where: { id: workLogId },
    include: {
      placement: {
        include: {
          offer: true,
          student: {
            include: { user: true },
          },
        },
      },
    },
  });

  if (!workLog) {
    throw new Error("Înregistrarea de pontaj nu a fost găsită.");
  }

  if (isCompany && workLog.placement.offer.companyId !== user.companyProfile!.id) {
    throw new Error("Nu aveți permisiunea de a valida pontaje pentru această companie.");
  }

  const updatedLog = await prisma.workLog.update({
    where: { id: workLogId },
    data: {
      status: WorkLogStatus.VALIDATED_TUTOR,
      validatedAt: new Date(),
      tutorFeedback: feedback?.trim() || null,
    },
  });

  // Notificare student
  const studentUserId = workLog.placement.student.userId;
  const logDateStr = workLog.date.toLocaleDateString("ro-RO");
  const feedbackNote = feedback?.trim() ? ` Feedback tutore: "${feedback.trim()}"` : "";

  await createNotification({
    userId: studentUserId,
    title: "Ore de practică validate",
    message: `Tutorele a validat intrarea de pontaj din ${logDateStr} (${workLog.hoursWorked} ore).${feedbackNote}`,
    type: NotificationType.SYSTEM_ALERT,
  });

  revalidatePath("/");
  return { success: true, workLog: updatedLog };
}

/**
 * 3. Respingere intrare pontaj de către tutorele de practică
 */
export async function rejectWorkLog(workLogId: string, feedback: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Neautentificat.");

  const isCompany = user.role === UserRole.COMPANY_TUTOR && !!user.companyProfile;
  const isAdmin = user.role === UserRole.ADMIN;
  if (!isCompany && !isAdmin) {
    throw new Error("Acces neautorizat. Doar tutorele companiei sau administratorul poate respinge pontajul.");
  }

  const feedbackText = feedback?.trim();
  if (!feedbackText || feedbackText.length < 3) {
    throw new Error("Te rugăm să specifici motivul respingerii pontajului (minim 3 caractere).");
  }

  const workLog = await prisma.workLog.findUnique({
    where: { id: workLogId },
    include: {
      placement: {
        include: {
          offer: true,
          student: {
            include: { user: true },
          },
        },
      },
    },
  });

  if (!workLog) {
    throw new Error("Înregistrarea de pontaj nu a fost găsită.");
  }

  if (isCompany && workLog.placement.offer.companyId !== user.companyProfile!.id) {
    throw new Error("Nu aveți permisiunea de a respinge pontaje pentru această companie.");
  }

  const updatedLog = await prisma.workLog.update({
    where: { id: workLogId },
    data: {
      status: WorkLogStatus.REJECTED,
      validatedAt: new Date(),
      tutorFeedback: feedbackText,
    },
  });

  // Notificare student
  const studentUserId = workLog.placement.student.userId;
  const logDateStr = workLog.date.toLocaleDateString("ro-RO");

  await createNotification({
    userId: studentUserId,
    title: "Intrare de pontaj respinsă",
    message: `Tutorele a respins intrarea de pontaj din ${logDateStr} (${workLog.hoursWorked} ore). Motiv: "${feedbackText}". Te rugăm să ajustezi înregistrarea.`,
    type: NotificationType.SYSTEM_ALERT,
  });

  revalidatePath("/");
  return { success: true, workLog: updatedLog };
}
