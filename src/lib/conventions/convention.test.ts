/**
 * Suita de teste pentru generarea Convenției PDF ULBS și diacritice românești
 */
import assert from "assert";
import fs from "fs/promises";
import { execFile } from "child_process";
import { promisify } from "util";
import { describe, it } from "vitest";
import prisma from "@/lib/prisma";
import { generateConventionHtml } from "./template-html";
import { generateConventionPdf } from "./generator";
import { ConventionData } from "./types";
import { PlacementStatus, ConventionStatus, UserRole } from "@prisma/client";

const execFileAsync = promisify(execFile);

describe("Convenție de Practică ULBS (PDF & Diacritice)", () => {
  it("generează șablon HTML cu toate secțiunile și diacriticele românești (ă, â, î, ș, ț, Ă, Â, Î, Ș, Ț)", () => {
    const sampleData: ConventionData = {
      conventionNumber: "ULBS-ING-2027-TEST0001",
      dateStr: "19.11.2026",
      facultyName: "Facultatea de Inginerie",
      universityName: "Universitatea „Lucian Blaga” din Sibiu",
      universityAddress: "str. Emil Cioran nr. 4, Sibiu",
      decanName: "Prof.univ.dr.ing. Maria Vințan",
      supervisorName: "Conf.univ.dr.ing. Cadru Supervizor",
      supervisorPhone: "0269/217928",
      supervisorEmail: "supervizor@ulbsibiu.ro",
      companyName: "Compania Românească de Tehnologie SRL",
      companyAddress: "Bd. Victoriei nr. 10",
      companyCity: "Sibiu",
      cuiCif: "RO12345678",
      legalRepresentative: "Ion Georgescu",
      tutorName: "Mihai Vlădescu",
      tutorEmail: "tutor@crt.ro",
      studentName: "Ștefan Pătrașcu",
      specialization: "Calculatoare și Tehnologia Informației",
      studyYear: 3,
      group: "CTI-31",
      periodStart: "05.07.2027",
      periodEnd: "25.07.2027",
      totalHours: 90,
      dailyHours: 6,
      workSchedule: "luni-vineri",
      locationAddress: "Bd. Victoriei nr. 10, Sibiu",
      offerTitle: "Dezvoltare Aplicații Web și Sisteme Distribuite",
      creditsCount: 4,
    };

    const html = generateConventionHtml(sampleData);

    // Verificăm diacriticele
    const diacritics = ["ă", "â", "î", "ș", "ț", "Ă", "Â", "Î", "Ș", "Ț"];
    for (const char of diacritics) {
      assert.ok(
        html.includes(char),
        `Șablonul HTML trebuie să conțină caracterul diacritic '${char}'`
      );
    }

    assert.ok(html.includes("CONVENȚIE"), "Trebuie să conțină antetul 'CONVENȚIE'");
    assert.ok(html.includes("ART. 1 Obiectul convenției"), "Trebuie să conțină ART. 1");
    assert.ok(html.includes("ART. 12 Prevederi finale"), "Trebuie să conțină ART. 12");
    assert.ok(html.includes("ANEXA 1"), "Trebuie să conțină ANEXA 1 (Portofoliu de practică)");
    assert.ok(html.includes("PORTOFOLIU DE PRACTICĂ"), "Trebuie să conțină titlul Portofoliului");
    assert.ok(html.includes("ANEXA 2"), "Trebuie să conțină ANEXA 2 (Tabel nominal)");
    assert.ok(html.includes("TABEL NOMINAL"), "Trebuie să conțină titlul Tabelului nominal");
  });

  it("generează fișier PDF real nativ (fără LibreOffice) și îl salvează în storage/conventions/", async () => {
    const uniquePrefix = `convtest-${Date.now()}`;

    const studentUser = await prisma.user.create({
      data: {
        email: `${uniquePrefix}-stud@test.ulbsibiu.ro`,
        passwordHash: "hash",
        firstName: "Marius",
        lastName: "Ionescu",
        role: UserRole.STUDENT,
        studentProfile: {
          create: {
            specialization: "Tehnologia Informatiei",
            studyYear: 2,
            group: "TI-21",
          },
        },
      },
      include: { studentProfile: true },
    });

    const companyUser = await prisma.user.create({
      data: {
        email: `${uniquePrefix}-comp@test.ro`,
        passwordHash: "hash",
        firstName: "Radu",
        lastName: "Muntean",
        role: UserRole.COMPANY_TUTOR,
        companyProfile: {
          create: {
            companyName: "Smart Software Solutions",
            cuiCif: `RO-${Date.now()}`,
            address: "Str. Alba Iulia nr. 45",
            city: "Sibiu",
            offers: {
              create: {
                title: "Internship Web Fullstack",
                description: "Stagiu de practică",
                location: "Sibiu, Str. Alba Iulia nr. 45",
                startDate: new Date("2027-07-05"),
                endDate: new Date("2027-07-25"),
                tutorName: "Ing. Radu Muntean",
                tutorEmail: "radu@smartsoft.ro",
              },
            },
          },
        },
      },
      include: { companyProfile: { include: { offers: true } } },
    });

    const studentProfileId = studentUser.studentProfile!.id;
    const offerId = companyUser.companyProfile!.offers[0].id;

    const placement = await prisma.placement.create({
      data: {
        studentId: studentProfileId,
        offerId: offerId,
        status: PlacementStatus.CONFIRMED,
        confirmedAt: new Date(),
      },
    });

    let generatedResult: any = null;

    try {
      generatedResult = await generateConventionPdf(placement.id);

      assert.ok(generatedResult.pdfPath, "pdfPath trebuie definit");
      assert.ok(generatedResult.conventionNumber, "conventionNumber trebuie definit");

      const stat = await fs.stat(generatedResult.pdfPath);
      assert.ok(stat.size > 1000, `Fișierul PDF generat trebuie să aibă dimensiune validă (size: ${stat.size})`);

      const dbConvention = await prisma.internshipConvention.findUnique({
        where: { placementId: placement.id },
      });

      assert.ok(dbConvention, "Convenția trebuie să existe în DB");
      assert.strictEqual(dbConvention.status, ConventionStatus.GENERATED, "Statusul inițial trebuie să fie GENERATED");
      assert.ok(dbConvention.generatedPdfUrl, "generatedPdfUrl trebuie setat");
    } finally {
      if (generatedResult?.pdfPath) {
        try {
          await fs.unlink(generatedResult.pdfPath);
        } catch {}
      }

      await prisma.placement.deleteMany({ where: { id: placement.id } });
      await prisma.user.deleteMany({
        where: { id: { in: [studentUser.id, companyUser.id] } },
      });
    }
  });
});
