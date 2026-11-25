import path from "path";
import fs from "fs/promises";

/** Returnează directorul rădăcină de stocare (configurabil prin STORAGE_PATH pentru volume persistente) */
export function getStorageRoot(): string {
  return process.env.STORAGE_PATH || path.join(process.cwd(), "storage");
}

/** Returnează directorul pentru CV-uri private */
export function getCvsDir(): string {
  return path.join(getStorageRoot(), "cvs");
}

/** Returnează directorul pentru convenții PDF generate */
export function getConventionsDir(): string {
  return path.join(getStorageRoot(), "conventions");
}

/** Returnează directorul pentru convenții semnate încărcate */
export function getSignedConventionsDir(): string {
  return path.join(getStorageRoot(), "conventions", "signed");
}

/** Returnează calea absolută pentru un CV privat stocat în <STORAGE_PATH>/cvs/<filename> */
export function getPrivateCvPath(filename: string): string {
  return path.join(getCvsDir(), filename);
}

/** Returnează calea absolută pentru o convenție în <STORAGE_PATH>/conventions/<filename> */
export function getConventionPath(filename: string): string {
  return path.join(getConventionsDir(), filename);
}

/** Returnează calea absolută pentru o convenție semnată în <STORAGE_PATH>/conventions/signed/<filename> */
export function getSignedConventionPath(filename: string): string {
  return path.join(getSignedConventionsDir(), filename);
}

/** Creează directoarele de stocare dacă nu există */
export async function ensureStorageDirs(): Promise<void> {
  const dirs = [
    getCvsDir(),
    getConventionsDir(),
    getSignedConventionsDir(),
  ];
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}
