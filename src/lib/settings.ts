import prisma from "@/lib/prisma";
import { TieBreakerRule } from "@prisma/client";

export interface SystemSettingsData {
  id: string;
  requiredHours: number;
  tieBreakerRule: TieBreakerRule;
  updatedAt: Date;
}

/**
 * Obține setările globale de sistem. Dacă nu există, le inițializează cu valorile implicite (120 ore, APPLICATION_ORDER).
 */
export async function getSystemSettings(): Promise<SystemSettingsData> {
  const existing = await prisma.systemSettings.findUnique({
    where: { id: "global" },
  });

  if (existing) {
    return existing;
  }

  // Creare idempotentă cu valorile default
  return await prisma.systemSettings.upsert({
    where: { id: "global" },
    update: {},
    create: {
      id: "global",
      requiredHours: 120,
      tieBreakerRule: TieBreakerRule.APPLICATION_ORDER,
    },
  });
}

/**
 * Actualizează setările globale de practică
 */
export async function updateSystemSettings(params: {
  requiredHours?: number;
  tieBreakerRule?: TieBreakerRule;
}): Promise<SystemSettingsData> {
  const dataToUpdate: { requiredHours?: number; tieBreakerRule?: TieBreakerRule } = {};

  if (params.requiredHours !== undefined) {
    if (params.requiredHours <= 0 || !Number.isInteger(params.requiredHours)) {
      throw new Error("Numărul de ore obligatorii trebuie să fie un întreg pozitiv.");
    }
    dataToUpdate.requiredHours = params.requiredHours;
  }

  if (params.tieBreakerRule !== undefined) {
    if (!Object.values(TieBreakerRule).includes(params.tieBreakerRule)) {
      throw new Error("Regula de departajare este invalidă. Valori permise: APPLICATION_ORDER, ACADEMIC_SCORE.");
    }
    dataToUpdate.tieBreakerRule = params.tieBreakerRule;
  }

  return await prisma.systemSettings.upsert({
    where: { id: "global" },
    update: dataToUpdate,
    create: {
      id: "global",
      requiredHours: params.requiredHours ?? 120,
      tieBreakerRule: params.tieBreakerRule ?? TieBreakerRule.APPLICATION_ORDER,
    },
  });
}
