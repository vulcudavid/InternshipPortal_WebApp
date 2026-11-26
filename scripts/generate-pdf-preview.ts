import fs from "fs/promises";
import path from "path";
import { execSync } from "child_process";
import { buildConventionPdfBuffer } from "../src/lib/conventions/pdf-builder";
import { ConventionData } from "../src/lib/conventions/types";

async function generateSamplePreview() {
  const imagesDir = path.join(process.cwd(), "docs", "images");
  await fs.mkdir(imagesDir, { recursive: true });

  const sampleData: ConventionData = {
    conventionNumber: "ULBS-ING-2026-CONTI001",
    dateStr: "26.11.2026",
    facultyName: "Facultatea de Inginerie",
    universityName: "Universitatea „Lucian Blaga” din Sibiu",
    universityAddress: "str. Emil Cioran nr. 4, Sibiu",
    decanName: "Prof.univ.dr.ing. Maria Vințan",
    supervisorName: "Conf.univ.dr.ing. Mihai Ionescu",
    supervisorPhone: "0269/217928",
    supervisorEmail: "coordonator.practica@ulbsibiu.ro",
    companyName: "Continental Automotive Sibiu",
    companyAddress: "Str. Salzburg nr. 8",
    companyCity: "Sibiu",
    cuiCif: "RO12345678",
    bankAccount: "RO05INGB0000999901234567",
    bankName: "ING Bank Sibiu",
    legalRepresentative: "Dr. Ing. Elena Popa (Director General)",
    contactPhone: "+40 269 123 456",
    tutorName: "Elena Popa (Lead Software Architect)",
    tutorRole: "Tutore de practică",
    tutorPhone: "+40 269 123 456",
    tutorEmail: "elena.popa@continental-sibiu.com",
    studentName: "Alexandru Radu",
    specialization: "Calculatoare și Tehnologia Informației",
    studyYear: 3,
    group: "331 CTI",
    studentPhone: "+40 740 111 222",
    studentEmail: "alexandru.radu@student.ulbsibiu.ro",
    periodStart: "01.07.2026",
    periodEnd: "30.09.2026",
    totalHours: 90,
    dailyHours: 6,
    workSchedule: "luni-vineri, interval 09:00 - 15:00",
    locationAddress: "Sibiu, Str. Salzburg nr. 8 (Regim Hibrid)",
    offerTitle: "Software Engineering Intern - Autonomous & Connected Mobility",
    creditsCount: 4,
  };

  console.log("📄 Generare buffer PDF convenție...");
  const pdfBuffer = await buildConventionPdfBuffer(sampleData);

  const samplePdfPath = path.join(imagesDir, "sample-conventie.pdf");
  await fs.writeFile(samplePdfPath, pdfBuffer);
  console.log(`✅ Fișier PDF salvat la: ${samplePdfPath}`);

  const targetPngPath = path.join(imagesDir, "conventie-pdf-preview.png");

  try {
    console.log("🖼️ Generare previzualizare PNG cu qlmanage...");
    execSync(`qlmanage -t -s 1400 -o "${imagesDir}" "${samplePdfPath}"`, {
      stdio: "inherit",
    });

    const generatedPngPath = path.join(imagesDir, "sample-conventie.pdf.png");
    await fs.rename(generatedPngPath, targetPngPath);
    console.log(`🎉 Previzualizare PNG generată cu succes: ${targetPngPath}`);
  } catch (err) {
    console.error("Eroare qlmanage:", err);
  }
}

generateSamplePreview().catch(console.error);
