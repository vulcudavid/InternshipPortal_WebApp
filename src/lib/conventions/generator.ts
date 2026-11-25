import fs from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import prisma from "@/lib/prisma";
import { ConventionStatus, PlacementStatus } from "@prisma/client";
import { ConventionData } from "./types";
import { generateConventionHtml } from "./template-html";
import { ensureStorageDirs, getConventionsDir } from "../storage";

const execFileAsync = promisify(execFile);

/**
 * Compilează obiectul ConventionData complet pentru un plasament.
 */
export async function buildConventionData(placementId: string): Promise<ConventionData> {
  const placement = await prisma.placement.findUnique({
    where: { id: placementId },
    include: {
      student: {
        include: {
          user: true,
        },
      },
      offer: {
        include: {
          company: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!placement) {
    throw new Error(`Plasamentul cu ID-ul ${placementId} nu a fost găsit.`);
  }

  const { student, offer } = placement;
  const company = offer.company;

  const convYear = new Date().getFullYear();
  const convSuffix = placement.id.replace(/-/g, "").slice(0, 8).toUpperCase();
  const conventionNumber = `ULBS-ING-${convYear}-${convSuffix}`;

  const startDateStr = offer.startDate
    ? new Date(offer.startDate).toLocaleDateString("ro-RO")
    : "05.07.2027";
  const endDateStr = offer.endDate
    ? new Date(offer.endDate).toLocaleDateString("ro-RO")
    : "25.07.2027";

  return {
    conventionNumber,
    dateStr: new Date().toLocaleDateString("ro-RO"),
    // Universitate
    facultyName: "Facultatea de Inginerie",
    universityName: "Universitatea „Lucian Blaga” din Sibiu",
    universityAddress: "str. Emil Cioran nr. 4, Sibiu",
    decanName: "Prof.univ.dr.ing. Maria Vințan",
    supervisorName: "Conf.univ.dr.ing. Coordonator Practică",
    supervisorPhone: "0269/217928",
    supervisorEmail: "inginerie.practica@ulbsibiu.ro",
    // Partener / Companie
    companyName: company.companyName,
    companyAddress: company.address,
    companyCity: company.city,
    cuiCif: company.cuiCif,
    bankAccount: undefined,
    bankName: undefined,
    legalRepresentative: `${company.user.firstName} ${company.user.lastName}`,
    contactPhone: company.contactPhone || undefined,
    // Tutore
    tutorName: offer.tutorName,
    tutorRole: "Tutore de practică",
    tutorPhone: company.contactPhone || undefined,
    tutorEmail: offer.tutorEmail,
    // Student
    studentName: `${student.user.firstName} ${student.user.lastName}`,
    specialization: student.specialization,
    studyYear: student.studyYear,
    group: student.group,
    studentPhone: student.phone || undefined,
    studentEmail: student.user.email,
    // Stagiu
    periodStart: startDateStr,
    periodEnd: endDateStr,
    totalHours: 90,
    dailyHours: 6,
    workSchedule: "luni-vineri",
    locationAddress: offer.location || `${company.address}, ${company.city}`,
    offerTitle: offer.title,
    creditsCount: 4,
  };
}

/**
 * Generează fișierul PDF oficial al convenției ULBS utilizând LibreOffice headless.
 */
export async function generateConventionPdf(placementId: string): Promise<{
  conventionId: string;
  pdfPath: string;
  pdfFilename: string;
  conventionNumber: string;
  data: ConventionData;
}> {
  await ensureStorageDirs();

  const data = await buildConventionData(placementId);
  const htmlContent = generateConventionHtml(data);

  const conventionsDir = getConventionsDir();
  const tempHtmlFilename = `temp_${placementId}.html`;
  const tempHtmlPath = path.join(conventionsDir, tempHtmlFilename);
  const targetPdfFilename = `convention_${placementId}.pdf`;
  const targetPdfPath = path.join(conventionsDir, targetPdfFilename);

  // 1. Scriem fișierul HTML intermediar UTF-8
  await fs.writeFile(tempHtmlPath, htmlContent, "utf-8");

  // 2. Rulăm conversia cu soffice
  try {
    await execFileAsync("soffice", [
      "--headless",
      "--convert-to",
      "pdf",
      "--outdir",
      conventionsDir,
      tempHtmlPath,
    ]);

    // LibreOffice va crea temp_${placementId}.pdf
    const generatedPdfPath = path.join(conventionsDir, `temp_${placementId}.pdf`);
    await fs.rename(generatedPdfPath, targetPdfPath);
  } finally {
    // Curățăm fișierul HTML temporar
    try {
      await fs.unlink(tempHtmlPath);
    } catch {
      // Ignorăm dacă fișierul a fost deja șters
    }
  }

  // 3. Salvăm sau actualizăm înregistrarea în baza de date
  const convention = await prisma.internshipConvention.upsert({
    where: { placementId },
    update: {
      conventionNumber: data.conventionNumber,
      status: ConventionStatus.GENERATED,
      prefilledData: data as any,
      generatedPdfUrl: targetPdfFilename,
      updatedAt: new Date(),
    },
    create: {
      placementId,
      conventionNumber: data.conventionNumber,
      status: ConventionStatus.GENERATED,
      prefilledData: data as any,
      generatedPdfUrl: targetPdfFilename,
    },
  });

  return {
    conventionId: convention.id,
    pdfPath: targetPdfPath,
    pdfFilename: targetPdfFilename,
    conventionNumber: data.conventionNumber,
    data,
  };
}
