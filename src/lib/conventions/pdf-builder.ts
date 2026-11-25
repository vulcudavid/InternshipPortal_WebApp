import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { ConventionData } from "./types";

/**
 * Încarcă fontul Roboto cu suport UTF-8 complet pentru diacritice românești (ă, â, î, ș, ț).
 * Fallback la Helvetica standard dacă fontul nu este accesibil.
 */
function setupFonts(doc: typeof PDFDocument.prototype) {
  const fontsDir = path.join(process.cwd(), "src/lib/conventions/fonts");
  const regularPath = path.join(fontsDir, "Roboto-Regular.ttf");
  const boldPath = path.join(fontsDir, "Roboto-Bold.ttf");

  if (fs.existsSync(regularPath) && fs.existsSync(boldPath)) {
    doc.registerFont("Main", regularPath);
    doc.registerFont("Main-Bold", boldPath);
    return { regular: "Main", bold: "Main-Bold" };
  }

  // Fallback la fonturile built-in
  return { regular: "Helvetica", bold: "Helvetica-Bold" };
}

/**
 * Generează bufferul PDF nativ complet pentru Convenția de Practică ULBS.
 */
export async function buildConventionPdfBuffer(data: ConventionData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 40, bottom: 40, left: 45, right: 45 },
        info: {
          Title: `Convenție de Practică ULBS - ${data.conventionNumber}`,
          Author: "Universitatea Lucian Blaga din Sibiu - Facultatea de Inginerie",
          Subject: "Convenție-cadru privind efectuarea stagiului de practică",
        },
      });

      const { regular, bold } = setupFonts(doc);

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err: Error) => reject(err));

      const dateFormatted = data.dateStr || new Date().toLocaleDateString("ro-RO");

      // ── PAGINA 1: CONVENȚIE-CADRU ───────────────────────────────────────────
      // Antet ULBS
      doc
        .font(bold)
        .fontSize(8)
        .fillColor("#334155")
        .text(
          "ROMÂNIA • MINISTERUL EDUCAȚIEI • UNIVERSITATEA „LUCIAN BLAGA” DIN SIBIU • FACULTATEA DE INGINERIE",
          { align: "center" }
        );
      doc.moveDown(0.5);

      // Linie sub antet
      doc.strokeColor("#cbd5e1").lineWidth(0.8).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.8);

      // Titlu
      doc.font(bold).fontSize(14).fillColor("#0f172a").text("CONVENȚIE", { align: "center" });
      doc
        .font(bold)
        .fontSize(11)
        .fillColor("#0f172a")
        .text("PRIVIND EFECTUAREA STAGIULUI DE PRACTICĂ", { align: "center" });
      doc
        .font(bold)
        .fontSize(10)
        .fillColor("#1e293b")
        .text(`NR. ${data.conventionNumber}`, { align: "center" });
      doc.moveDown(0.8);

      // Părțile semnatare
      doc.font(regular).fontSize(9.5).fillColor("#1e293b");
      doc.text("Prezenta convenție se încheie între:", { align: "justify" });
      doc.moveDown(0.3);

      doc.text(
        `${data.facultyName} din cadrul ${data.universityName}, cu sediul în Sibiu, ${data.universityAddress}, reprezentată prin decan, ${data.decanName}, numită în continuare organizator de practică,`,
        { align: "justify" }
      );
      doc.moveDown(0.3);

      doc.font(bold).text("și", { align: "center" });
      doc.moveDown(0.3);

      const bankInfo = data.bankAccount
        ? `Cont bancar nr. ${data.bankAccount} deschis la ${data.bankName || "-"}`
        : "";
      doc.font(regular).text(
        `${data.companyName}, cu sediul în ${data.companyCity}, Str. ${data.companyAddress}, cod fiscal ${data.cuiCif}${bankInfo ? `, ${bankInfo}` : ""}, reprezentată legal de către ${data.legalRepresentative}, în calitate de partener de practică,`,
        { align: "justify" }
      );
      doc.moveDown(0.3);

      doc.text(
        "în temeiul Legii nr. 258/2007 privind practica elevilor și studenților și a Ordinului 3955/2008 privind aprobarea Cadrului general de organizare a stagiilor de practică.",
        { align: "justify" }
      );
      doc.moveDown(0.6);

      // Articolele 1-12
      const articles = [
        {
          title: "ART. 1 Obiectul convenției",
          body: `(1) Convenția stabilește cadrul în care se organizează și se desfășoară stagiul de practică în vederea consolidării cunoștințelor teoretice și pentru formarea abilităților, spre a le aplica în concordanță cu specializarea ${data.specialization}, studenții anului ${data.studyYear} de la Facultatea de Inginerie.\n(2) Stagiul de practică este realizat de studenți în vederea dobândirii competențelor profesionale menționate în portofoliul de practică (proiect: ${data.offerTitle}).`,
        },
        {
          title: "ART. 2 Statutul practicanților",
          body: "Practicanții rămân, pe toată durata stagiului de pregătire practică, studenți ai Universității „Lucian Blaga” din Sibiu.",
        },
        {
          title: "ART. 3 Durata și perioada desfășurării stagiului de practică",
          body: `Stagiul de practică se va desfășura în perioada ${data.periodStart} – ${data.periodEnd}, având un volum total de ${data.totalHours} ore (${data.dailyHours} ore/zi, ${data.workSchedule}).`,
        },
        {
          title: "ART. 4 Responsabilitățile practicanților",
          body: "(1) Practicanții au obligația de a respecta programul de lucru stabilit și de a executa activitățile specificate de tutore conform portofoliului de practică.\n(2) Pe durata stagiului, practicanții respectă regulamentul de ordine interioară și normele SSM.",
        },
        {
          title: "ART. 5 Responsabilitățile partenerului de practică",
          body: `(1) Partenerul desemnează ca tutore pe dl/dna ${data.tutorName} (${data.tutorEmail}).\n(2) Partenerul asigură instructajul de securitate și sănătate în muncă și pune la dispoziție mijloacele necesare dobândirii competențelor.`,
        },
        {
          title: "ART. 6 Obligațiile organizatorului de practică",
          body: `(1) Cadrul didactic supervizor desemnat este: ${data.supervisorName} (${data.supervisorEmail}).\n(2) În urma finalizării cu succes a stagiului, se vor acorda ${data.creditsCount} credite transferabile (ECTS).`,
        },
        {
          title: "ART. 7 Evaluare și confidențialitate",
          body: "Evaluarea se realizează prin fișa de pontaj și raportul final al tutorelui. Părțile se obligă la păstrarea confidențialității conform normelor legale.",
        },
        {
          title: "ART. 8 Prevederi finale",
          body: `Prezenta convenție s-a încheiat la data de ${dateFormatted}, în două exemplare originale, având anexele 1-2 parte integrantă.`,
        },
      ];

      for (const art of articles) {
        doc.font(bold).fontSize(9.5).fillColor("#0f172a").text(art.title);
        doc.font(regular).fontSize(9).fillColor("#334155").text(art.body, { align: "justify" });
        doc.moveDown(0.4);
      }

      // Semnături Pagina 1
      doc.moveDown(0.8);
      const signY = doc.y;
      doc.font(bold).fontSize(9).fillColor("#0f172a");
      doc.text("Organizator de practică", 45, signY);
      doc.font(regular).text(`${data.facultyName}`, 45, signY + 12);
      doc.text(`Decan, ${data.decanName}`, 45, signY + 24);
      doc.font(regular).fontSize(8).fillColor("#64748b").text("(Semnătură și Ștampilă)", 45, signY + 45);

      doc.font(bold).fontSize(9).fillColor("#0f172a");
      doc.text("Partener de practică", 340, signY, { align: "right", width: 210 });
      doc.font(regular).text(`${data.companyName}`, 340, signY + 12, { align: "right", width: 210 });
      doc.text(`Reprezentant legal, ${data.legalRepresentative}`, 340, signY + 24, { align: "right", width: 210 });
      doc.font(regular).fontSize(8).fillColor("#64748b").text("(Semnătură și Ștampilă)", 340, signY + 45, { align: "right", width: 210 });

      // ── PAGINA 2: ANEXA 1 (PORTOFOLIU DE PRACTICĂ) ──────────────────────────
      doc.addPage();

      doc.font(bold).fontSize(9).fillColor("#64748b").text(`ANEXA 1 la convenția nr. ${data.conventionNumber}`, { align: "right" });
      doc.moveDown(0.5);

      doc.font(bold).fontSize(13).fillColor("#0f172a").text("PORTOFOLIU DE PRACTICĂ", { align: "center" });
      doc.font(regular).fontSize(9).fillColor("#475569").text(`la Convenția privind efectuarea stagiului de practică nr. ${data.conventionNumber}`, { align: "center" });
      doc.moveDown(0.8);

      const itemsAnexa1 = [
        `1. Durata totală a pregătirii practice: ${data.totalHours} ore / 4 credite ECTS`,
        `2. Calendarul pregătirii: ${data.workSchedule}, interval 09:00 - 15:00 (${data.dailyHours} ore/zi)`,
        `3. Perioada stagiului: ${data.periodStart} – ${data.periodEnd}`,
        `4. Locația stagiului: ${data.locationAddress}`,
        `5. Cadru didactic supervizor: ${data.supervisorName} (Tel: ${data.supervisorPhone}, Email: ${data.supervisorEmail})`,
        `6. Tutore desemnat de partener: ${data.tutorName} (Email: ${data.tutorEmail})`,
        `7. Proiect / Tematică de practică: ${data.offerTitle}`,
      ];

      doc.font(regular).fontSize(9).fillColor("#1e293b");
      for (const item of itemsAnexa1) {
        doc.text(item, { align: "justify" });
        doc.moveDown(0.25);
      }

      doc.moveDown(0.5);
      doc.font(bold).fontSize(10).fillColor("#0f172a").text("8. Definirea competențelor dobândite pe perioada stagiului:");
      doc.moveDown(0.3);

      const competencies = [
        {
          name: "Competențe cognitive & de înțelegere",
          desc: `Utilizarea cunoștințelor specifice specializării ${data.specialization} în context industrial real.`,
        },
        {
          name: "Competențe aplicative & implementare",
          desc: `Scriere cod, depanare, testare și integrare practică pe proiectul: ${data.offerTitle}.`,
        },
        {
          name: "Competențe transversale & etică",
          desc: "Lucru în echipă, comunicare eficientă, respectarea procedurilor de calitate și securitate.",
        },
      ];

      for (const comp of competencies) {
        doc.font(bold).fontSize(8.5).fillColor("#0f172a").text(`• ${comp.name}: `);
        doc.font(regular).fontSize(8.5).fillColor("#334155").text(comp.desc, { align: "justify" });
        doc.moveDown(0.2);
      }

      doc.moveDown(0.5);
      doc.font(bold).fontSize(10).fillColor("#0f172a").text("9. Comisia de evaluare a stagiului de practică:");
      doc.moveDown(0.3);

      doc.font(regular).fontSize(8.5).fillColor("#1e293b");
      doc.text(`1. ${data.supervisorName} — Cadru didactic supervizor (Universitate)`);
      doc.text(`2. ${data.tutorName} — Tutore de practică (${data.companyName})`);
      doc.text(`3. ${data.studentName} — Practicant (${data.specialization}, An ${data.studyYear})`);

      // Semnături Anexa 1
      doc.moveDown(1.5);
      const signY2 = doc.y;
      doc.font(bold).fontSize(8.5).fillColor("#0f172a");
      doc.text("Organizator de practică", 45, signY2);
      doc.font(regular).text(`Decan, ${data.decanName}`, 45, signY2 + 12);
      doc.font(regular).fontSize(7.5).fillColor("#64748b").text("(Semnătură)", 45, signY2 + 35);

      doc.font(bold).fontSize(8.5).fillColor("#0f172a");
      doc.text("Partener de practică", 340, signY2, { align: "right", width: 210 });
      doc.font(regular).text(`Director, ${data.legalRepresentative}`, 340, signY2 + 12, { align: "right", width: 210 });
      doc.font(regular).fontSize(7.5).fillColor("#64748b").text("(Semnătură)", 340, signY2 + 35, { align: "right", width: 210 });

      // ── PAGINA 3: ANEXA 2 (TABEL NOMINAL) ───────────────────────────────────
      doc.addPage();

      doc.font(bold).fontSize(9).fillColor("#64748b").text(`ANEXA 2 la convenția nr. ${data.conventionNumber}`, { align: "right" });
      doc.moveDown(0.5);

      doc.font(bold).fontSize(13).fillColor("#0f172a").text("TABEL NOMINAL", { align: "center" });
      doc.font(regular).fontSize(9).fillColor("#475569").text(
        `Privind studenții anului ${data.studyYear}, specializarea ${data.specialization}, Facultatea de Inginerie ULBS, repartizați la ${data.companyName}`,
        { align: "center" }
      );
      doc.moveDown(1);

      // Tabel student
      const tableTop = doc.y;
      doc.strokeColor("#cbd5e1").lineWidth(1);
      doc.rect(45, tableTop, 505, 60).stroke();

      doc.font(bold).fontSize(8.5).fillColor("#0f172a");
      doc.text("Student Practicant", 55, tableTop + 8);
      doc.text("Specializare / Grupă", 210, tableTop + 8);
      doc.text("Perioadă Stagiu", 360, tableTop + 8);

      doc.strokeColor("#e2e8f0").lineWidth(0.5).moveTo(45, tableTop + 24).lineTo(550, tableTop + 24).stroke();

      doc.font(regular).fontSize(8.5).fillColor("#334155");
      doc.text(data.studentName, 55, tableTop + 32);
      doc.text(`${data.specialization} (Grupa ${data.group})`, 210, tableTop + 32);
      doc.text(`${data.periodStart} – ${data.periodEnd}`, 360, tableTop + 32);

      // Semnături finale Anexa 2
      doc.moveDown(3);
      const signY3 = doc.y + 30;
      doc.font(bold).fontSize(8.5).fillColor("#0f172a");
      doc.text("Organizator de practică", 45, signY3);
      doc.font(regular).text(`${data.facultyName}`, 45, signY3 + 12);
      doc.text(`Decan, ${data.decanName}`, 45, signY3 + 24);
      doc.font(regular).fontSize(7.5).fillColor("#64748b").text("(Semnătură și Ștampilă)", 45, signY3 + 45);

      doc.font(bold).fontSize(8.5).fillColor("#0f172a");
      doc.text("Partener de practică", 340, signY3, { align: "right", width: 210 });
      doc.font(regular).text(`${data.companyName}`, 340, signY3 + 12, { align: "right", width: 210 });
      doc.text(`Director, ${data.legalRepresentative}`, 340, signY3 + 24, { align: "right", width: 210 });
      doc.font(regular).fontSize(7.5).fillColor("#64748b").text("(Semnătură și Ștampilă)", 340, signY3 + 45, { align: "right", width: 210 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
