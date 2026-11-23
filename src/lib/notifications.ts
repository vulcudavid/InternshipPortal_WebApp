import prisma from "@/lib/prisma";
import { NotificationType, UserRole } from "@prisma/client";

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
}

/**
 * Creează o notificare de sistem pentru un utilizator
 */
export async function createNotification({
  userId,
  title,
  message,
  type = NotificationType.SYSTEM_ALERT,
}: CreateNotificationParams) {
  return await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
    },
  });
}

/**
 * Emite notificări către toți utilizatorii cu rolul COORDINATOR
 */
export async function notifyCoordinators({
  title,
  message,
  type = NotificationType.SYSTEM_ALERT,
}: {
  title: string;
  message: string;
  type?: NotificationType;
}) {
  const coordinators = await prisma.user.findMany({
    where: {
      role: UserRole.COORDINATOR,
      isActive: true,
    },
    select: { id: true },
  });

  if (coordinators.length === 0) return [];

  const createdNotifications = await prisma.$transaction(
    coordinators.map((coord) =>
      prisma.notification.create({
        data: {
          userId: coord.id,
          title,
          message,
          type,
        },
      })
    )
  );

  return createdNotifications;
}
