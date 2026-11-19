import path from "path";
import fs from "fs/promises";

const PROJECT_ROOT = path.resolve(process.cwd());

/** Returnează calea absolută pentru un CV privat stocat în storage/cvs/<filename> */
export function getPrivateCvPath(filename: string): string {
  return path.join(PROJECT_ROOT, "storage", "cvs", filename);
}

/** Returnează calea absolută pentru o convenție în storage/conventions/<filename> */
export function getConventionPath(filename: string): string {
  return path.join(PROJECT_ROOT, "storage", "conventions", filename);
}

/** Returnează calea absolută pentru o convenție semnată în storage/conventions/signed/<filename> */
export function getSignedConventionPath(filename: string): string {
  return path.join(PROJECT_ROOT, "storage", "conventions", "signed", filename);
}

/** Creează directoarele de stocare dacă nu există */
export async function ensureStorageDirs(): Promise<void> {
  const dirs = [
    path.join(PROJECT_ROOT, "storage", "cvs"),
    path.join(PROJECT_ROOT, "storage", "conventions"),
    path.join(PROJECT_ROOT, "storage", "conventions", "signed"),
  ];
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}
