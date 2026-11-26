import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { ConventionData } from "../conventions/types";

/**
 * Configurează fontul cu suport complet UTF-8 pentru diacritice românești (ă, â, î, ș, ț, Ă, Â, Î, Ș, Ț, ş, ţ).
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

  return { regular: "Helvetica", bold: "Helvetica-Bold" };
}

/**
 * Formatează un nume în Title Case (ex: "alex barac" -> "Alex Barac").
 */
function toTitleCase(str: string | undefined | null): string {
  if (!str) return "";
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Evită duplicarea prefixului "Str." dacă adresa începe deja cu un prefix stradal.
 */
function formatCompanyAddress(address: string | undefined | null): string {
  if (!address || !address.trim()) return "Str. .......................";
  const trimmed = address.trim();
  if (/^(str\.|strada|bd\.|bulevardul|calea|soseaua|șos\.)/i.test(trimmed)) {
    return trimmed;
  }
  return `Str. ${trimmed}`;
}

/**
 * Desenează un tabel cu chenar negru exact ca în documentul Word oficial.
 */
function drawTable(
  doc: typeof PDFDocument.prototype,
  regularFont: string,
  boldFont: string,
  startX: number,
  startY: number,
  colWidths: number[],
  headers: string[],
  rows: string[][],
  fontSize: number = 8.5,
  rowPadding: number = 3
): number {
  let currentY = startY;

  // Header
  if (headers && headers.length > 0) {
    let maxHeaderHeight = 0;
    doc.font(boldFont).fontSize(fontSize);

    for (let i = 0; i < headers.length; i++) {
      const h = doc.heightOfString(headers[i], { width: colWidths[i] - (rowPadding * 2), align: "center" });
      if (h > maxHeaderHeight) maxHeaderHeight = h;
    }
    maxHeaderHeight += rowPadding * 2;

    if (currentY + maxHeaderHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      currentY = doc.page.margins.top;
    }

    let cellX = startX;
    for (let i = 0; i < headers.length; i++) {
      doc.rect(cellX, currentY, colWidths[i], maxHeaderHeight).strokeColor("#000000").lineWidth(0.5).stroke();
      doc.font(boldFont).fontSize(fontSize).fillColor("#000000").text(headers[i], cellX + rowPadding, currentY + rowPadding, {
        width: colWidths[i] - (rowPadding * 2),
        align: "center",
      });
      cellX += colWidths[i];
    }
    currentY += maxHeaderHeight;
  }

  // Rows
  doc.font(regularFont).fontSize(fontSize);
  for (const row of rows) {
    let maxRowHeight = 0;
    for (let i = 0; i < row.length; i++) {
      const text = row[i] || "";
      const h = doc.heightOfString(text, { width: colWidths[i] - (rowPadding * 2), align: "left" });
      if (h > maxRowHeight) maxRowHeight = h;
    }
    maxRowHeight = Math.max(maxRowHeight + (rowPadding * 2), 15);

    if (currentY + maxRowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      currentY = doc.page.margins.top;
    }

    let cellX = startX;
    for (let i = 0; i < row.length; i++) {
      doc.rect(cellX, currentY, colWidths[i], maxRowHeight).strokeColor("#000000").lineWidth(0.5).stroke();
      const text = row[i] || "";
      if (text) {
        doc.font(regularFont).fontSize(fontSize).fillColor("#000000").text(text, cellX + rowPadding, currentY + rowPadding, {
          width: colWidths[i] - (rowPadding * 2),
          align: "left",
        });
      }
      cellX += colWidths[i];
    }
    currentY += maxRowHeight;
  }

  // CRITIC: Restabilire x la marginea din stânga pentru ca textele următoare să nu fie constrânse la o celulă
  doc.x = startX;
  return currentY;
}

/**
 * Desenează blocul oficial de semnături pe două coloane egale (stânga: Organizator, dreapta: Partener).
 */
function drawSignaturesBlock(
  doc: typeof PDFDocument.prototype,
  regularFont: string,
  boldFont: string,
  decanName: string,
  companyName: string,
  directorName: string,
  topY?: number
) {
  const leftX = doc.page.margins.left;
  const totalW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colW = (totalW - 20) / 2;
  const rightX = leftX + colW + 20;

  let y = topY || doc.y + 12;
  if (y + 60 > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
    y = doc.page.margins.top + 10;
  }

  doc.font(boldFont).fontSize(9.5).fillColor("#000000");
  doc.text("Organizator de practică", leftX, y, { width: colW, align: "left" });
  doc.text("Partener de practică", rightX, y, { width: colW, align: "left" });

  doc.font(regularFont).fontSize(9.5);
  doc.text("Facultatea de Inginerie", leftX, y + 14, { width: colW, align: "left" });
  doc.text(companyName || "........................................................", rightX, y + 14, { width: colW, align: "left" });

  doc.text("Decan,", leftX, y + 28, { width: colW, align: "left" });
  doc.text("Director,", rightX, y + 28, { width: colW, align: "left" });

  doc.font(boldFont).fontSize(9.5);
  const cleanDecan = decanName ? decanName.replace(/prof\.?univ\.?dr\.?ing\.?/i, "").trim() : "Maria VINŢAN";
  doc.text(`Prof.univ.dr.ing. ${cleanDecan || "Maria VINŢAN"}`, leftX, y + 42, { width: colW, align: "left" });
  doc.text(directorName || "........................................................", rightX, y + 42, { width: colW, align: "left" });

  doc.y = y + 58;
  doc.x = leftX;
}

/**
 * Generează bufferul PDF nativ identic cu documentul oficial Word (.docx)
 * al Facultății de Inginerie ULBS, încadrat exact în 5 pagini:
 * - Paginile 1 - 3: Convenția-cadru (Articolele 1 - 12 + Semnături)
 * - Pagina 4: Anexa 1 (Portofoliu de practică complet + Semnături)
 * - Pagina 5: Anexa 2 (Tabel nominal + Semnături)
 */
export async function buildConventionPdfBuffer(data: ConventionData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 42.5, bottom: 42.5, left: 51, right: 51 },
        bufferPages: true,
        info: {
          Title: `Convenție privind efectuarea stagiului de practică - ${data.conventionNumber}`,
          Author: "Universitatea Lucian Blaga din Sibiu - Facultatea de Inginerie",
          Subject: "Convenție de practică conform șablonului oficial Licență 2026-2027",
        },
      });

      const { regular, bold } = setupFonts(doc);

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err: Error) => reject(err));

      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const leftMargin = doc.page.margins.left;
      const baseFontSize = 10.5;
      const titleFontSize = 10.5;
      const lineGapVal = 2.2;
      const indentVal = 24;

      // ─────────────────────────────────────────────────────────────────────────
      // SECȚIUNEA 1: CONVENȚIE-CADRU (Articolele 1–12 + Preambul)
      // Flux continuu natural fără page-break-uri forțate
      // ─────────────────────────────────────────────────────────────────────────

      // Antet oficial ULBS cu Logo extras din șablonul .docx
      const logoPath = path.join(process.cwd(), "src/lib/conventions/assets/ulbs-logo.png");
      const linePath = path.join(process.cwd(), "src/lib/conventions/assets/ulbs-header-line.png");

      if (fs.existsSync(logoPath)) {
        const logoWidth = 140;
        doc.image(logoPath, leftMargin, doc.page.margins.top - 12, { width: logoWidth });

        doc.font(bold).fontSize(8.5).fillColor("#0b2f63");
        doc.text("Ministerul Educației și Cercetării", leftMargin, doc.page.margins.top - 10, {
          width: pageWidth,
          align: "right",
        });
        doc.font(regular).fontSize(8.5).fillColor("#0b2f63");
        doc.text("Universitatea „Lucian Blaga” din Sibiu", leftMargin, doc.page.margins.top + 3, {
          width: pageWidth,
          align: "right",
        });
        doc.text("Facultatea de Inginerie", leftMargin, doc.page.margins.top + 16, {
          width: pageWidth,
          align: "right",
        });

        if (fs.existsSync(linePath)) {
          doc.image(linePath, leftMargin, doc.page.margins.top + 32, { width: pageWidth, height: 3 });
        }

        doc.y = doc.page.margins.top + 45;
        doc.x = leftMargin;
      }

      // Titlu centrat unic exact ca în docx
      doc.font(bold).fontSize(12.5).fillColor("#000000").text("CONVENŢIE", { width: pageWidth, align: "center" });
      doc.font(bold).fontSize(11).text("PRIVIND EFECTUAREA STAGIULUI DE PRACTICĂ", { width: pageWidth, align: "center" });
      doc.font(bold).fontSize(10.5).text(`NR. ${data.conventionNumber || "........................................."}`, { width: pageWidth, align: "center" });
      doc.moveDown(0.4);

      // Preambul
      doc.font(regular).fontSize(baseFontSize).fillColor("#000000");
      doc.text("Prezenta convenţie se încheie între:", { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal });
      doc.moveDown(0.25);

      doc.text(
        "Facultatea de Inginerie din cadrul Universității „Lucian Blaga” din Sibiu, cu sediul în Sibiu, str. Emil Cioran nr. 4, reprezentată prin decan, prof.univ.dr.ing. Maria Vințan, numită în continuare organizator de practică,",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.25);

      doc.text("şi", { width: pageWidth, align: "center", lineGap: lineGapVal });
      doc.moveDown(0.25);

      const regComText = data.regCom ? `sub nr. ${data.regCom}` : "sub nr. ............................";
      const bankAccountVal = data.bankAccount || "....................................";
      const bankNameVal = data.bankName || "...............................";
      const bankText = `Cont bancar nr. ${bankAccountVal} deschis la ${bankNameVal}`;
      const repText = data.legalRepresentative || "...................................................................................";

      doc.text(
        `${data.companyName || ".............................................................."}, cu sediul în ${data.companyCity || ".................................."}, ${formatCompanyAddress(data.companyAddress)}, înregistrată la Registrul Comerțului din ${data.companyCity || "........................."} ${regComText}, cod fiscal ${data.cuiCif || ".............................."}, ${bankText}, reprezentată legal de către ${repText}, în calitate de partener de practică,`,
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.25);

      doc.text(
        "în temeiul Legii nr. 258/2007 privind practica elevilor şi studenţilor şi a Ordinului 3955/2008 privind aprobarea Cadrului general de organizare a stagiilor de practică în cadrul programelor de studii universitare de licență și de masterat și a Convenției-cadru privind efectuarea stagiului de practică în cadrul programelor de studii universitare de licență sau masterat.",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.45);

      // ART. 1
      doc.font(bold).fontSize(titleFontSize).fillColor("#000000").text("ART. 1    Obiectul convenţiei", { width: pageWidth, indent: indentVal, lineGap: lineGapVal });
      doc.moveDown(0.2);
      doc.font(regular).fontSize(baseFontSize).text(
        "(1) Convenţia stabileşte cadrul în care se organizează şi se desfăşoară stagiul de practică în vederea consolidării cunoştinţelor teoretice şi pentru formarea abilităţilor, spre a le aplica în concordanţă cu specializarea, studenţii anilor II, III de la Facultatea de Inginerie.",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.25);
      doc.font(regular).fontSize(baseFontSize).text(
        "(2) Stagiul de practică este realizat de studenţi în vederea dobândirii competenţelor profesionale menţionate în portofoliul de practică, parte integrantă a prezentei convenţii, şi a elaborării proiectului de diplomă.",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.25);
      doc.font(regular).fontSize(baseFontSize).text(
        "(3) Modalităţile de derulare şi conţinutul stagiului de pregătire practică sunt descrise în prezenta convenţie şi în portofoliul de practică cuprins în anexa la prezenta convenţie.",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.45);

      // ART. 2
      doc.font(bold).fontSize(titleFontSize).fillColor("#000000").text("ART. 2    Statutul practicanţilor", { width: pageWidth, indent: indentVal, lineGap: lineGapVal });
      doc.moveDown(0.2);
      doc.font(regular).fontSize(baseFontSize).text(
        "Practicanţii rămân, pe toată durata stagiului de pregătire practică, studenţi ai Universităţii „Lucian Blaga” din Sibiu.",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.45);

      // ART. 3
      doc.font(bold).fontSize(titleFontSize).fillColor("#000000").text("ART. 3    Durata şi perioada desfăşurării stagiului de practică", { width: pageWidth, indent: indentVal, lineGap: lineGapVal });
      doc.moveDown(0.2);
      doc.font(regular).fontSize(baseFontSize).text(
        `Stagiul de practică se va desfăşura în perioada ${data.periodStart || "01.07.2026"} – ${data.periodEnd || "30.09.2026"}.`,
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.45);

      // ART. 4
      doc.font(bold).fontSize(titleFontSize).fillColor("#000000").text("ART. 4    Responsabilităţile practicanţilor", { width: pageWidth, indent: indentVal, lineGap: lineGapVal });
      doc.moveDown(0.2);
      doc.font(regular).fontSize(baseFontSize).text(
        "(1) Practicanţii au obligaţia ca, pe durata derulării stagiului de practică, să respecte programul de lucru stabilit şi să execute activităţile specificate de tutore în conformitate cu portofoliul de practică, în condiţiile respectării cadrului legal cu privire la volumul şi dificultatea acestora.",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.25);
      doc.font(regular).fontSize(baseFontSize).text(
        "(2) Pe durata stagiului, practicanţii respectă regulamentul de ordine interioară al partenerului de practică. În cazul nerespectării acestui regulament, conducătorul partenerului de practică îşi rezervă dreptul de a anula convenţia, după ce în prealabil a ascultat punctul de vedere al practicantului şi al tutorelui şi a înştiinţat conducătorul instituţiei de învăţământ şi după primirea confirmării de primire a acestei informaţii.",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.25);
      doc.font(regular).fontSize(baseFontSize).text(
        "(3) Practicanţii au obligaţia de a respecta normele de securitate şi sănătate în muncă pe care şi le-au însuşit de la reprezentantul partenerului de practică înainte de începerea stagiului de practică.",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.25);
      doc.font(regular).fontSize(baseFontSize).text(
        "(4) De asemenea, practicanţii se angajează să nu folosească, în niciun caz, informaţiile la care au acces în timpul stagiului despre partenerul de practică sau clienţii săi, pentru a le comunica unui terţ sau pentru a le publica, chiar după terminarea stagiului, decât cu acordul respectivului partener de practică.",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.45);

      // ART. 5 (Flux natural fără page break forțat)
      doc.font(bold).fontSize(titleFontSize).fillColor("#000000").text("ART. 5    Responsabilităţile partenerului de practică", { width: pageWidth, indent: indentVal, lineGap: lineGapVal });
      doc.moveDown(0.2);
      doc.font(regular).fontSize(baseFontSize).text(
        "(1) Partenerul de practică va stabili un tutore pentru stagiul de practică, selectat dintre salariaţii proprii şi ale cărui obligaţii sunt menţionate în portofoliul de practică.",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.25);
      doc.font(regular).fontSize(baseFontSize).text(
        "(2) În cazul nerespectării obligaţiilor de către practicant/practicanţi, tutorele va contacta cadrul didactic supervizor, aplicându-se sancţiuni conform regulamentului de organizare şi funcţionare al Universităţii “Lucian Blaga” Sibiu, Facultatea de Inginerie.",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.25);
      doc.font(regular).fontSize(baseFontSize).text(
        "(3) Înainte de începerea stagiului de practică, partenerul are obligaţia de a face practicanţilor instructajul cu privire la normele de securitate şi sănătate în muncă, în conformitate cu legislaţia în vigoare. Printre responsabilităţile sale, partenerul de practică va lua măsurile necesare pentru securitatea şi sănătatea în muncă a practicanţilor, precum şi pentru comunicarea regulilor de prevenire asupra riscurilor profesionale.",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.25);
      doc.font(regular).fontSize(baseFontSize).text(
        "(4) Partenerul de practică are următoarele atribuţii: elaborează proiectele necesare realizării practicii de specialitate;",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.25);
      doc.font(regular).fontSize(baseFontSize).text(
        "(5) Partenerul de practică trebuie să pună la dispoziţia practicanţilor toate mijloacele necesare pentru dobândirea competenţelor precizate în portofoliul de practică pentru studenţii Facultăţii de Inginerie.",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.25);
      doc.font(regular).fontSize(baseFontSize).text(
        "(6) Partenerul de practică are obligaţia de a asigura practicanţilor accesul liber la serviciul de medicina muncii, pe durata derulării pregătirii practice.",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.45);

      // ART. 6
      doc.font(bold).fontSize(titleFontSize).fillColor("#000000").text("ART. 6    Obligaţiile organizatorului de practică", { width: pageWidth, indent: indentVal, lineGap: lineGapVal });
      doc.moveDown(0.2);
      doc.font(regular).fontSize(baseFontSize).text(
        "(1) Organizatorul de practică desemnează un cadru didactic supervizor, responsabil cu planificarea, organizarea şi supravegherea desfăşurării pregătirii practice. Cadrul didactic supervizor, împreună cu tutorele desemnat de partenerul de practică, stabilesc tematica de practică şi competenţele profesionale care fac obiectul stagiului de pregătire practică.",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.25);
      doc.font(regular).fontSize(baseFontSize).text(
        "(2) În cazul în care derularea stagiului de pregătire practică nu este conformă cu angajamentele luate de către partenerul de practică în cadrul prezentei convenţii, conducătorul instituţiei de învăţământ superior poate decide întreruperea stagiului de pregătire practică conform convenţiei, după informarea prealabilă a conducătorului partenerului de practică şi după primirea confirmării de primire a acestei informaţii.",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.25);
      doc.font(regular).fontSize(baseFontSize).text(
        "(3) În urma desfăşurării cu succes a stagiului de practică, organizatorul va acorda practicantului numărul de credite aferente.",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.45);

      // ART. 7
      doc.font(bold).fontSize(titleFontSize).fillColor("#000000").text("ART. 7    Persoane desemnate de organizatorul de practică şi partenerul de practică", { width: pageWidth, indent: indentVal, lineGap: lineGapVal });
      doc.moveDown(0.2);
      doc.font(regular).fontSize(baseFontSize).text(
        "Tutorii (persoanele care vor avea responsabilitatea practicantului din partea partenerului de practică):",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.2);

      // Tabel tutori pe 2 coloane egale (50% - 50%) conform Word
      const tutorColW = [pageWidth / 2, pageWidth / 2];
      const tutorCell1 =
        `Dl/Dna ${data.tutorName || "...................................."}\n` +
        `Funcţia ${data.tutorRole || "Tutore de practică"}\n` +
        `Telefon ${data.tutorPhone || "................................"}\n` +
        `Email ${data.tutorEmail || "..................................."}`;

      const tutorCell2 =
        "Dl/Dna ....................................\n" +
        "Funcţia .................................\n" +
        "Telefon ................................\n" +
        "Email ...................................";

      const tableTutorY = drawTable(doc, regular, bold, leftMargin, doc.y, tutorColW, [], [[tutorCell1, tutorCell2]], 8.5, 2.5);
      doc.y = tableTutorY + 4;
      doc.x = leftMargin;

      doc.font(regular).fontSize(baseFontSize).text(
        `(2) Cadrul didactic supervizor, responsabil cu urmărirea derulării stagiului de practică din partea organizatorului de practică:\n` +
        `Dl/Dna ${data.supervisorName || "............................................"}\n` +
        `Funcţia ${data.supervisorRole || "Cadru didactic supervizor"}\n` +
        `Telefon ${data.supervisorPhone || "0269/217928"}\n` +
        `Email: ${data.supervisorEmail || ".............................@ulbsibiu.ro"}`,
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.45);
      doc.x = leftMargin;

      // ART. 8
      doc.font(bold).fontSize(titleFontSize).fillColor("#000000").text("ART. 8    Evaluarea stagiului de pregătire practică prin credite transferabile", { width: pageWidth, indent: indentVal, lineGap: lineGapVal });
      doc.moveDown(0.2);
      doc.font(regular).fontSize(baseFontSize).text(
        `Numărul de credite transferabile ce vor fi obţinute în urma desfăşurării stagiului de practică este de ${data.creditsCount || 4} credite.`,
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.45);
      doc.x = leftMargin;

      // ART. 9
      doc.font(bold).fontSize(titleFontSize).fillColor("#000000").text("ART. 9    Raportul privind stagiul de pregătire practică", { width: pageWidth, indent: indentVal, lineGap: lineGapVal });
      doc.moveDown(0.2);
      doc.font(regular).fontSize(baseFontSize).text(
        "(1) În timpul derulării stagiului de practică, tutorele împreună cu cadrul didactic supervizor vor evalua practicantul în permanenţă, pe baza unei fişe de observaţie/evaluare. Vor fi evaluate atât nivelul de dobândire a competenţelor profesionale, cât şi comportamentul şi modalitatea de integrare a practicantului în activitatea partenerului de practică (disciplină, punctualitate, responsabilitate în rezolvarea sarcinilor, respectarea regulamentului de ordine interioară al societăţăţii etc.).",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.25);
      doc.font(regular).fontSize(baseFontSize).text(
        "(2) La finalul stagiului de practică, tutorele elaborează un raport, pe baza evaluării nivelului de dobândire a competenţelor de către practicant/practicanţi. Rezultatul acestei evaluări va sta la baza notării practicantului de către cadrul didactic supervizor.",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.25);
      doc.font(regular).fontSize(baseFontSize).text(
        "(3) Periodic şi după încheierea stagiului de practică, practicanţii vor prezenta un caiet de practică care va cuprinde:\n" +
        "    – denumirea modulului de pregătire;\n" +
        "    – competenţe exersate;\n" +
        "    – activităţi desfăşurate pe perioada stagiului de practică;\n" +
        "    – observaţii personale privitoare la activitatea depusă.",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.45);
      doc.x = leftMargin;

      // ART. 10
      doc.font(bold).fontSize(titleFontSize).fillColor("#000000").text("ART. 10    Sănătatea şi securitatea în muncă. Protecţia socială a practicanţilor", { width: pageWidth, indent: indentVal, lineGap: lineGapVal });
      doc.moveDown(0.2);
      doc.font(regular).fontSize(baseFontSize).text(
        "(1) Partenerul de practică are obligaţia respectării prevederilor legale cu privire la sănătatea şi securitatea în muncă a practicanţilor pe durata stagiului de practică.",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.25);
      doc.font(regular).fontSize(baseFontSize).text(
        "(2) Practicanţilor li se asigură protecţie socială conform legislaţiei în vigoare. Ca urmare, conform dispoziţiilor Legii nr. 346/2002 privind asigurările pentru accidente de muncă şi boli profesionale, cu modificările şi completările ulterioare, practicanţii beneficiază de legislaţia privitoare la accidentele de muncă pe toată durata efectuării pregătirii practice.",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.25);
      doc.font(regular).fontSize(baseFontSize).text(
        "(4) În cazul unui accident suportat de practicanţi, fie în cursul lucrului, fie în timpul deplasării la lucru, partenerul de practică se angajează să înştiinţeze asigurătorul cu privire la accidentul care a avut loc.",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.45);
      doc.x = leftMargin;

      // ART. 11 (Flux natural fără page break forțat)
      doc.font(bold).fontSize(titleFontSize).fillColor("#000000").text("ART. 11    Confidențialitate", { width: pageWidth, indent: indentVal, lineGap: lineGapVal });
      doc.moveDown(0.2);
      doc.font(regular).fontSize(baseFontSize).text(
        "Organizatorul de practică se obligă:",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.2);
      doc.font(regular).fontSize(baseFontSize).text(
        "să păstreze secretul și confidențialitatea tuturor INFORMAȚIILOR primite sau care i-au fost puse la dispoziție de către partenerul de practică și să împiedice orice divulgare a acestor INFORMAȚII unor terțe părți;",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.2);
      doc.font(regular).fontSize(baseFontSize).text(
        "să limiteze în cadrul instituției circulația INFORMAȚIILOR doar către persoane a căror activitate justifică divulgarea acestora și să se asigure că aceste persoane au înțeles pe deplin obligația lor de a păstra secretul și de a restrânge utilizarea acestor INFORMAȚII în scopurile definite în cadrul prezentei convenții;",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.2);
      doc.font(regular).fontSize(baseFontSize).text(
        "să nu divulge INFORMAȚIILE către terțe părți fără a fi obținut acordul scris din partea partenerului de practică și fără angajamentul valid al terțelor părți că vor păstra confidențialitatea INFORMAȚIILOR;",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.2);
      doc.font(regular).fontSize(baseFontSize).text(
        "să nu utilizeze INFORMAȚIILE în alt scop decât cel ce formează obiectul convenției, fără acordul scris prealabil dat de partenerul de practică;",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.2);
      doc.font(regular).fontSize(baseFontSize).text(
        "să nu reproducă nici integral nici parțial, indiferent sub ce formă se găsesc ele, în documentele sale publicitare, sau, în mod general, prin niciun mijloc de comunicare INFORMAȚIILE legate de produsele sub marca folosită de către partenerul de practică și/sau de către clienții acestuia sau sub o alta marcă, fapt ce ar reprezenta o încălcare a legilor privind proprietatea intelectuală și constituie infracțiunea de contrafacere;",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.2);
      doc.font(regular).fontSize(baseFontSize).text(
        "să nu reproducă și să nu publice nici un material, ofertă, broșură, reclamă sau orice fel de formă de publicitate, marketing, comunicare electronică sau înscris, indiferent de formă sau suport, în care să folosească numele, marca, emblema sau orice alt atribut de proprietate intelectuală utilizat de către partenerul de practică și/sau de către clienții acestuia și/sau grupul de firme din care face parte partenerul de practică, fără a obtine acordul scris, expres și prealabil dat de partenerul de practică.",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.45);
      doc.x = leftMargin;

      // ART. 12
      doc.font(bold).fontSize(titleFontSize).fillColor("#000000").text("ART. 12    Prevederi finale", { width: pageWidth, indent: indentVal, lineGap: lineGapVal });
      doc.moveDown(0.2);
      doc.font(regular).fontSize(baseFontSize).text(
        "(1) Modificarea prezentei convenţii se face numai prin act adiţional încheiat între părţile contractante.",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.25);
      doc.font(regular).fontSize(baseFontSize).text(
        "(2) Prezenta convenţie reprezintă voinţa părţilor şi înlătură orice altă înţelegere verbală dintre acestea, anterioară sau ulterioară încheierii ei.",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.25);
      doc.font(regular).fontSize(baseFontSize).text(
        "(3) Soluţionarea neînţelegerilor se efectuează pe cale amiabilă, în caz contrar, de instanţele judecătoreşti competente.",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.25);
      doc.font(regular).fontSize(baseFontSize).text(
        "(4) Anexele 1-2 fac parte integrantă din prezenta convenţie.",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.25);
      doc.font(regular).fontSize(baseFontSize).text(
        "Prezenta convenţie s-a încheiat azi, în două exemplare originale, cu aceeaşi valoare juridică.",
        { width: pageWidth, indent: indentVal, align: "justify", lineGap: lineGapVal }
      );
      doc.moveDown(0.5);
      doc.x = leftMargin;

      // Semnături Convenție-cadru pe 2 coloane (cu break-inside: avoid)
      drawSignaturesBlock(doc, regular, bold, data.decanName, data.companyName, data.legalRepresentative);

      // ─────────────────────────────────────────────────────────────────────────
      // SECȚIUNEA 2: ANEXA 1 - PORTOFOLIU DE PRACTICĂ (Pagină separată)
      // ─────────────────────────────────────────────────────────────────────────
      doc.addPage();
      doc.x = leftMargin;

      doc.font(bold).fontSize(9.5).fillColor("#000000").text("ANEXĂ 1", { width: pageWidth, align: "left" });
      doc.font(regular).fontSize(9).text(`la convenţia nr ${data.conventionNumber || "…………………."}`, { width: pageWidth, align: "left" });
      doc.moveDown(0.2);

      doc.font(bold).fontSize(10.5).text("PORTOFOLIU DE PRACTICĂ", { width: pageWidth, align: "center" });
      doc.font(regular).fontSize(9).text(`la Convenţia privind efectuarea stagiului de practică nr. ${data.conventionNumber || "......................."}`, { width: pageWidth, align: "center" });
      doc.moveDown(0.3);

      const itemsAnexa1 = [
        "1. Durata totală a pregătirii practice: 90 ore/semestru",
        `2. Calendarul pregătirii: ${data.workSchedule || "luni-vineri"}`,
        `3. Perioada stagiului, timpul de lucru şi orarul (de precizat zilele de pregătire practică în cazul timpului de lucru parţial): ${data.periodStart || "01.07.2026"} – ${data.periodEnd || "30.09.2026"}, ${data.dailyHours || 6} ore/zi, interval orar 09:00 - 15:00`,
        `4. Adresa unde se va derula stagiul de pregătire practică: ${data.locationAddress || data.companyAddress || ".................................................................."}`,
        "5. Deplasarea în afara locului unde este repartizat practicantul vizează următoarele locaţii: .................. nu este cazul ..................",
        "6. Condiţii de primire a studenţilor în stagiul de practică – conform reglementărilor existente în legătură cu prevenirea răspândirii COVID19",
        "7. Modalităţi prin care se asigură complementaritatea între pregătirea dobândită de studenţi în instituţia de învăţământ superior şi în cadrul stagiului de practică: - completarea caietului/raportului de practică",
        `8. Numele şi prenumele cadrelor  didactice care asigură supravegherea pedagogică a practicantului pe perioada stagiului de practică: ${data.supervisorName || "........................................"}`,
        "9. Drepturi şi responsabilităţi ale cadrului didactic din unitatea de învăţământ - organizator al practicii, pe perioada stagiului de practică: - să monitorizeze și evalueze stagiul de practică desfășurat de către student/ți",
        `10. Numele şi prenumele tutorelui/tutorilor  desemnat/i de societate care va asigura respectarea condiţiilor de pregătire şi dobândirea de către practicant a competenţelor profesionale planificate pentru perioada stagiului de practică: ${data.tutorName || "..........................................................................................."}`,
        "11. Drepturi şi responsabilităţi ale tutorelui de practică desemnat de partenerul de practică: să asigure respectarea condițiilor de pregătire şi dobândire de către practicant a competenţelor profesionale planificate pentru perioada stagiului de practică.",
        "12. Definirea competenţelor care vor fi dobândite pe perioada stagiului de practică",
      ];

      doc.font(regular).fontSize(8.2).fillColor("#000000");
      for (const item of itemsAnexa1) {
        doc.text(item, { width: pageWidth, align: "justify", lineGap: 0.5 });
        doc.moveDown(0.12);
      }
      doc.moveDown(0.2);

      // Tabel competențe (punctul 12) compactizat pentru a încape perfect pe o singură pagină
      const compColW = [30, 115, 110, 65, 125, 50];
      const compHeaders = ["Nr. Crt", "Competența", "Modul de pregătire", "Locul de muncă", "Activități planificate", "Observații"];
      const compRows = [
        [
          "1",
          "Competenţe privind cunoaşterea şi înţelegerea\nUtilizarea cunoştinţelor din domeniu în proiectarea activităţilor. Elaborarea de proiecte specifice domeniului în care să utilizeze concepte, teorii, modele.",
          "Participare activă la sarcinile programate conform caietului de practică.",
          "........",
          "Activități care să dezvolte competenţele cerute.",
          ".",
        ],
        [
          "2",
          "Competenţe în domeniul explicării şi interpretării\nExplicarea și interpretarea fenomenelor din domeniu pe baza conceptelor, teoriilor și modelelor însușite. Stabilirea unor relații și conexiuni între cunoștințele și informațiile din domeniu.",
          "Implicarea studenţilor în vederea realizării conexiunii între teorie și practică.",
          ".............",
          "Activităţi care să dezvolte competenţele cerute.",
          "",
        ],
        [
          "3",
          "Competenţe instrumental - aplicative\nAplicarea fenomenelor din domeniu pe baza conceptelor, teoriilor și modelelor însușite. Experimentarea unor fenomene specifice domeniului.",
          "Implicarea în rezolvarea sarcinilor încredințate de organizație.",
          "",
          "Activități care să dezvolte competenţele cerute.",
          "",
        ],
        [
          "4",
          "Competenţe atitudinale\nCooperarea eficientă în echipe de lucru profesionale, interdisciplinare, specifice desfășurării proiectelor din domeniu. Manifestarea unor atitudini pozitive, specifice incluziunii sociale.",
          "Participarea colaborativă în activităţi de echipă.",
          "",
          "Activități care să dezvolte competenţele cerute.",
          "",
        ],
      ];

      const compTableEndY = drawTable(doc, regular, bold, leftMargin, doc.y, compColW, compHeaders, compRows, 6.8, 2);
      doc.y = compTableEndY + 5;
      doc.x = leftMargin;

      // Punctul 13
      doc.font(regular).fontSize(8.2).fillColor("#000000").text(
        "13. Modalităţi de evaluare a pregătirii profesionale dobândite de practicanţi pe perioada stagiului de pregătire practică",
        { width: pageWidth }
      );
      doc.moveDown(0.15);

      const eval4ColW = [125, 145, 125, 100];
      const evalRows = [
        ["Cadru didactic supervizor", data.supervisorName || "", data.supervisorRole || "Cadru didactic", ""],
        ["Tutore", data.tutorName || "", data.tutorRole || "Tutore practică", ""],
        ["Practicant", toTitleCase(data.studentName) || "", `Student an ${data.studyYear || "III"}`, ""],
        ["Data", data.dateStr || new Date().toLocaleDateString("ro-RO"), "", ""],
      ];

      const evalTableEndY = drawTable(doc, regular, bold, leftMargin, doc.y, eval4ColW, ["", "Nume și prenume", "Funcție", "Semnătura"], evalRows, 7.5, 2);
      doc.y = evalTableEndY + 6;
      doc.x = leftMargin;

      // Semnături Anexa 1 pe 2 coloane
      drawSignaturesBlock(doc, regular, bold, data.decanName, data.companyName, data.legalRepresentative);

      // ─────────────────────────────────────────────────────────────────────────
      // SECȚIUNEA 3: ANEXA 2 - TABEL NOMINAL (Pagină separată)
      // ─────────────────────────────────────────────────────────────────────────
      doc.addPage();
      doc.x = leftMargin;

      doc.font(bold).fontSize(9.5).fillColor("#000000").text("ANEXĂ 2", { width: pageWidth, align: "left" });
      doc.font(regular).fontSize(9).text(`la convenţia nr ${data.conventionNumber || "…………………."}`, { width: pageWidth, align: "left" });
      doc.moveDown(0.3);

      doc.font(bold).fontSize(10.5).text("TABEL NOMINAL", { width: pageWidth, align: "center" });
      doc.font(regular).fontSize(9).text(
        `Cuprinzând studenţii anului ${data.studyYear || "............"}, an universitar 2026-2027, specializarea ${data.specialization || "........................................"},  Facultatea de Inginerie, care vor efectua stagiul de practică la partenerul de practică`,
        { width: pageWidth, align: "center" }
      );
      doc.moveDown(0.2);
      doc.font(bold).fontSize(10).text(data.companyName || "....................................................................", { width: pageWidth, align: "center" });
      doc.moveDown(0.6);

      // Tabelul cu cele 5 coloane
      const nominalColW = [135, 60, 95, 115, 90];
      const nominalHeaders = [
        "Nume si prenume student",
        "Grupa",
        "Semnatura student",
        "Cadru didactic coordonator",
        "Semnatura cadru didactic coordonator",
      ];

      const nominalRows = [
        [
          toTitleCase(data.studentName) || "",
          data.group || "",
          "",
          data.supervisorName || "",
          "",
        ],
        ["", "", "", "", ""],
        ["", "", "", "", ""],
        ["", "", "", "", ""],
        ["", "", "", "", ""],
      ];

      const nominalTableEndY = drawTable(doc, regular, bold, leftMargin, doc.y, nominalColW, nominalHeaders, nominalRows, 7.5, 3);
      doc.y = nominalTableEndY + 12;
      doc.x = leftMargin;

      // Semnături Anexa 2 pe 2 coloane
      drawSignaturesBlock(doc, regular, bold, data.decanName, data.companyName, data.legalRepresentative);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
