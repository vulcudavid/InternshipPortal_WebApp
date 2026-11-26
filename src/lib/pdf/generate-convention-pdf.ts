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
  fontSize: number = 8.5
): number {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  let currentY = startY;

  // Header
  if (headers && headers.length > 0) {
    let maxHeaderHeight = 0;
    doc.font(boldFont).fontSize(fontSize);

    // Calcul înălțime header
    for (let i = 0; i < headers.length; i++) {
      const h = doc.heightOfString(headers[i], { width: colWidths[i] - 8, align: "center" });
      if (h > maxHeaderHeight) maxHeaderHeight = h;
    }
    maxHeaderHeight += 8;

    if (currentY + maxHeaderHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      currentY = doc.page.margins.top;
    }

    // Desenare fundal și text header
    let cellX = startX;
    for (let i = 0; i < headers.length; i++) {
      doc.rect(cellX, currentY, colWidths[i], maxHeaderHeight).strokeColor("#000000").lineWidth(0.5).stroke();
      doc.font(boldFont).fontSize(fontSize).fillColor("#000000").text(headers[i], cellX + 4, currentY + 4, {
        width: colWidths[i] - 8,
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
      const h = doc.heightOfString(text, { width: colWidths[i] - 8, align: "left" });
      if (h > maxRowHeight) maxRowHeight = h;
    }
    maxRowHeight = Math.max(maxRowHeight + 8, 20);

    if (currentY + maxRowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      currentY = doc.page.margins.top;
    }

    let cellX = startX;
    for (let i = 0; i < row.length; i++) {
      doc.rect(cellX, currentY, colWidths[i], maxRowHeight).strokeColor("#000000").lineWidth(0.5).stroke();
      const text = row[i] || "";
      if (text) {
        doc.font(regularFont).fontSize(fontSize).fillColor("#000000").text(text, cellX + 4, currentY + 4, {
          width: colWidths[i] - 8,
          align: "left",
        });
      }
      cellX += colWidths[i];
    }
    currentY += maxRowHeight;
  }

  return currentY;
}

/**
 * Desenează blocul oficial de semnături Decan / Director.
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
  const rightX = 330;
  const colW = 200;

  let y = topY || doc.y + 15;
  if (y + 70 > doc.page.height - doc.page.margins.bottom) {
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
  doc.text(`Prof.univ.dr.ing. ${decanName ? decanName.replace(/prof\.?univ\.?dr\.?ing\.?/i, "").trim() : "Maria VINŢAN"}`, leftX, y + 42, { width: colW, align: "left" });
  if (directorName) {
    doc.text(directorName, rightX, y + 42, { width: colW, align: "left" });
  }

  doc.y = y + 65;
}

/**
 * Generează bufferul PDF nativ identic cu documentul oficial Word (.docx)
 * al Facultății de Inginerie ULBS.
 */
export async function buildConventionPdfBuffer(data: ConventionData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 40, bottom: 35, left: 50, right: 50 },
        bufferPages: true,
        info: {
          Title: `Convenție privind efectuarea stagiului de practică - ${data.conventionNumber}`,
          Author: "Universitatea Lucian Blaga din Sibiu - Facultatea de Inginerie",
          Subject: "Convenție de practică conform șablonului oficial Licență",
        },
      });

      const { regular, bold } = setupFonts(doc);

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err: Error) => reject(err));

      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const leftMargin = doc.page.margins.left;

      // ─────────────────────────────────────────────────────────────────────────
      // SECȚIUNEA 1: CONVENȚIE-CADRU (Paginile 1 - 2)
      // ─────────────────────────────────────────────────────────────────────────

      // Antet oficial ULBS cu Logo extras din șablonul .docx
      const logoPath = path.join(process.cwd(), "src/lib/conventions/assets/ulbs-logo.png");
      const linePath = path.join(process.cwd(), "src/lib/conventions/assets/ulbs-header-line.png");

      if (fs.existsSync(logoPath)) {
        const logoWidth = 145;
        doc.image(logoPath, leftMargin, doc.page.margins.top - 18, { width: logoWidth });

        doc.font(bold).fontSize(8.5).fillColor("#0b2f63");
        doc.text("Ministerul Educației și Cercetării", leftMargin, doc.page.margins.top - 15, {
          width: pageWidth,
          align: "right",
        });
        doc.font(regular).fontSize(8.5).fillColor("#0b2f63");
        doc.text("Universitatea „Lucian Blaga” din Sibiu", leftMargin, doc.page.margins.top - 2, {
          width: pageWidth,
          align: "right",
        });
        doc.text("Facultatea de Inginerie", leftMargin, doc.page.margins.top + 11, {
          width: pageWidth,
          align: "right",
        });

        if (fs.existsSync(linePath)) {
          doc.image(linePath, leftMargin, doc.page.margins.top + 28, { width: pageWidth, height: 3 });
        }

        doc.y = doc.page.margins.top + 40;
      }

      // Titlu centrat exact ca în docx
      doc.font(bold).fontSize(12).fillColor("#000000").text("CONVENŢIE", { align: "center" });
      doc.font(bold).fontSize(11).text("PRIVIND EFECTUAREA STAGIULUI DE PRACTICĂ", { align: "center" });
      doc.font(bold).fontSize(10.5).text(`NR. ${data.conventionNumber || "........................................."}`, { align: "center" });
      doc.moveDown(0.8);

      // Preambul
      doc.font(regular).fontSize(9.5).fillColor("#000000");
      doc.text("     Prezenta convenţie se încheie între:", { indent: 20 });
      doc.moveDown(0.3);

      doc.text(
        `Facultatea de Inginerie din cadrul Universității „Lucian Blaga” din Sibiu, cu sediul în Sibiu, str. Emil Cioran nr. 4, reprezentată prin decan, prof.univ.dr.ing. Maria Vințan, numită în continuare organizator de practică,`,
        { align: "justify" }
      );
      doc.moveDown(0.3);

      doc.text("şi", { align: "center" });
      doc.moveDown(0.3);

      const regComText = data.regCom ? `sub nr. ${data.regCom}` : "sub nr. ............................";
      const bankText = data.bankAccount
        ? `Cont bancar nr. ${data.bankAccount}   deschis la ${data.bankName || "..............................."}`
        : "Cont bancar nr. ............................................................   deschis la ...............................";
      const repText = data.legalRepresentative || "...................................................................................";

      doc.text(
        `${data.companyName || ".............................................................."}, cu sediul în ${data.companyCity || ".................................."}, Str. ${data.companyAddress || "......................."}, înregistrată la Registrul Comerțului din ${data.companyCity || "........................."} ${regComText}, cod fiscal ${data.cuiCif || ".............................."}, ${bankText}, reprezentată legal de către ${repText}, în calitate de partener de practică,`,
        { align: "justify" }
      );
      doc.moveDown(0.3);

      doc.text(
        "    în temeiul Legii nr. 258/2007 privind practica elevilor şi studenţilor şi a Ordinului 3955/2008 privind aprobarea Cadrului general de organizare a stagiilor de practică în cadrul programelor de studii universitare de licență și de masterat și a Convenției-cadru privind efectuarea stagiului de practică în cadrul programelor de studii universitare de licență sau masterat.",
        { align: "justify" }
      );
      doc.moveDown(0.6);

      // ART. 1
      doc.font(bold).fontSize(9.5).text("    ART. 1    Obiectul convenţiei");
      doc.font(regular).fontSize(9.2).text(
        "    (1) Convenţia stabileşte cadrul în care se organizează şi se desfăşoară stagiul de practică în vederea consolidării cunoştinţelor teoretice şi pentru formarea abilităţilor, spre a le aplica în concordanţă cu specializarea, studenţii anilor II, III de la Facultatea de Inginerie.\n" +
        "    (2) Stagiul de practică este realizat de studenţi în vederea dobândirii competenţelor profesionale menţionate în portofoliul de practică, parte integrantă a prezentei convenţii, şi a elaborării proiectului de diplomă.\n" +
        "    (3) Modalităţile de derulare şi conţinutul stagiului de pregătire practică sunt descrise în prezenta convenţie şi în portofoliul de practică cuprins în anexa la prezenta convenţie.",
        { align: "justify" }
      );
      doc.moveDown(0.5);

      // ART. 2
      doc.font(bold).fontSize(9.5).text("    ART. 2    Statutul practicanţilor");
      doc.font(regular).fontSize(9.2).text(
        "    Practicanţii rămân, pe toată durata stagiului de pregătire practică, studenţi ai Universităţii „Lucian Blaga” din Sibiu.",
        { align: "justify" }
      );
      doc.moveDown(0.5);

      // ART. 3
      doc.font(bold).fontSize(9.5).text("    ART. 3    Durata şi perioada desfăşurării stagiului de practică");
      doc.font(regular).fontSize(9.2).text(
        `Stagiul de practică se va desfăşura în perioada  ${data.periodStart || "05.07.2027"} – ${data.periodEnd || "25.07.2027"}.`,
        { align: "justify" }
      );
      doc.moveDown(0.5);

      // ART. 4
      doc.font(bold).fontSize(9.5).text("    ART. 4    Responsabilităţile practicanţilor");
      doc.font(regular).fontSize(9.2).text(
        "    (1) Practicanţii au obligaţia ca, pe durata derulării stagiului de practică, să respecte programul de lucru stabilit şi să execute activităţile specificate de tutore în conformitate cu portofoliul de practică, în condiţiile respectării cadrului legal cu privire la volumul şi dificultatea acestora.\n" +
        "    (2) Pe durata stagiului, practicanţii respectă regulamentul de ordine interioară al partenerului de practică. În cazul nerespectării acestui regulament, conducătorul partenerului de practică îşi rezervă dreptul de a anula convenţia, după ce în prealabil a ascultat punctul de vedere al practicantului şi al tutorelui şi a înştiinţat conducătorul instituţiei de învăţământ şi după primirea confirmării de primire a acestei informaţii.\n" +
        "    (3) Practicanţii au obligaţia de a respecta normele de securitate şi sănătate în muncă pe care şi le-au însuşit de la reprezentantul partenerului de practică înainte de începerea stagiului de practică.\n" +
        "    (4) De asemenea, practicanţii se angajează să nu folosească, în niciun caz, informaţiile la care au acces în timpul stagiului despre partenerul de practică sau clienţii săi, pentru a le comunica unui terţ sau pentru a le publica, chiar după terminarea stagiului, decât cu acordul respectivului partener de practică.",
        { align: "justify" }
      );
      doc.moveDown(0.5);

      // ART. 5
      doc.font(bold).fontSize(9.5).text("    ART. 5    Responsabilităţile partenerului de practică");
      doc.font(regular).fontSize(9.2).text(
        "    (1) Partenerul de practică va stabili un tutore pentru stagiul de practică, selectat dintre salariaţii proprii şi ale cărui obligaţii sunt menţionate în portofoliul de practică.\n" +
        "    (2) În cazul nerespectării obligaţiilor de către practicant/practicanţi, tutorele va contacta cadrul didactic supervizor, aplicându-se sancţiuni conform regulamentului de organizare şi funcţionare al Universităţii “Lucian Blaga” Sibiu, Facultatea de Inginerie.\n" +
        "    (3) Înainte de începerea stagiului de practică, partenerul are obligaţia de a face practicanţilor instructajul cu privire la normele de securitate şi sănătate în muncă, în conformitate cu legislaţia în vigoare. Printre responsabilităţile sale, partenerul de practică va lua măsurile necesare pentru securitatea şi sănătatea în muncă a practicanţilor, precum şi pentru comunicarea regulilor de prevenire asupra riscurilor profesionale.\n" +
        "    (4) Partenerul de practică are următoarele atribuţii: elaborează proiectele necesare realizării practicii de specialitate;\n" +
        "    (5) Partenerul de practică trebuie să pună la dispoziţia practicanţilor toate mijloacele necesare pentru dobândirea competenţelor precizate în portofoliul de practică pentru studenţii Facultăţii de Inginerie.\n" +
        "    (6) Partenerul de practică are obligaţia de a asigura practicanţilor accesul liber la serviciul de medicina muncii, pe durata derulării pregătirii practice.",
        { align: "justify" }
      );
      doc.moveDown(0.5);

      // ART. 6
      doc.font(bold).fontSize(9.5).text("    ART. 6    Obligaţiile organizatorului de practică");
      doc.font(regular).fontSize(9.2).text(
        "    (1) Organizatorul de practică desemnează un cadru didactic supervizor, responsabil cu planificarea, organizarea şi supravegherea desfăşurării pregătirii practice. Cadrul didactic supervizor, împreună cu tutorele desemnat de partenerul de practică, stabilesc tematica de practică şi competenţele profesionale care fac obiectul stagiului de pregătire practică.\n" +
        "    (2) În cazul în care derularea stagiului de pregătire practică nu este conformă cu angajamentele luate de către partenerul de practică în cadrul prezentei convenţii, conducătorul instituţiei de învăţământ superior poate decide întreruperea stagiului de pregătire practică conform convenţiei, după informarea prealabilă a conducătorului partenerului de practică şi după primirea confirmării de primire a acestei informaţii.\n" +
        "    (3) În urma desfăşurării cu succes a stagiului de practică, organizatorul va acorda practicantului numărul de credite aferente.",
        { align: "justify" }
      );
      doc.moveDown(0.5);

      // ART. 7
      doc.font(bold).fontSize(9.5).text("        ART. 7    Persoane desemnate de organizatorul de practică şi partenerul de practică");
      doc.font(regular).fontSize(9.2).text(
        "Tutorii (persoanele care vor avea responsabilitatea practicantului din partea partenerului de practică):"
      );
      doc.moveDown(0.3);

      // Tabel tutori pe 2 coloane
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

      const tableTutorY = drawTable(doc, regular, bold, leftMargin, doc.y, tutorColW, [], [[tutorCell1, tutorCell2]], 8.5);
      doc.y = tableTutorY + 5;

      doc.font(regular).fontSize(9.2).text(
        `    (2) Cadrul didactic supervizor, responsabil cu urmărirea derulării stagiului de practică din partea organizatorului de practică:\n` +
        `    Dl/Dna ${data.supervisorName || "............................................"}\n` +
        `    Funcţia ${data.supervisorRole || "Cadru didactic supervizor"}\n` +
        `    Telefon ${data.supervisorPhone || "0269/217928"}\n` +
        `    Email: ${data.supervisorEmail || ".............................@ulbsibiu.ro"}`,
        { align: "justify" }
      );
      doc.moveDown(0.5);

      // ART. 8
      doc.font(bold).fontSize(9.5).text("    ART. 8    Evaluarea stagiului de pregătire practică prin credite transferabile");
      doc.font(regular).fontSize(9.2).text(
        `    Numărul de credite transferabile ce vor fi obţinute în urma desfăşurării stagiului de practică este de  ${data.creditsCount || 4} credite.`,
        { align: "justify" }
      );
      doc.moveDown(0.5);

      // ART. 9
      doc.font(bold).fontSize(9.5).text("    ART. 9    Raportul privind stagiul de pregătire practică");
      doc.font(regular).fontSize(9.2).text(
        "    (1) În timpul derulării stagiului de practică, tutorele împreună cu cadrul didactic supervizor vor evalua practicantul în permanenţă, pe baza unei fişe de observaţie/evaluare. Vor fi evaluate atât nivelul de dobândire a competenţelor profesionale, cât şi comportamentul şi modalitatea de integrare a practicantului în activitatea partenerului de practică (disciplină, punctualitate, responsabilitate în rezolvarea sarcinilor, respectarea regulamentului de ordine interioară al societăţăţii etc.).\n" +
        "    (2) La finalul stagiului de practică, tutorele elaborează un raport, pe baza evaluării nivelului de dobândire a competenţelor de către practicant/practicanţi. Rezultatul acestei evaluări va sta la baza notării practicantului de către cadrul didactic supervizor.\n" +
        "    (3) Periodic şi după încheierea stagiului de practică, practicanţii vor prezenta un caiet de practică care va cuprinde:\n" +
        "    ● denumirea modulului de pregătire;\n" +
        "    ● competenţe exersate;\n" +
        "    ● activităţi desfăşurate pe perioada stagiului de practică;\n" +
        "    ● observaţii personale privitoare la activitatea depusă.",
        { align: "justify" }
      );
      doc.moveDown(0.5);

      // ART. 10
      doc.font(bold).fontSize(9.5).text("    ART. 10    Sănătatea şi securitatea în muncă\n    Protecţia socială a practicanţilor");
      doc.font(regular).fontSize(9.2).text(
        "    (1) Partenerul de practică are obligaţia respectării prevederilor legale cu privire la sănătatea şi securitatea în muncă a practicanţilor pe durata stagiului de practică.\n" +
        "    (2) Practicanţilor li se asigură protecţie socială conform legislaţiei în vigoare. Ca urmare, conform dispoziţiilor Legii nr. 346/2002 privind asigurările pentru accidente de muncă şi boli profesionale, cu modificările şi completările ulterioare, practicanţii beneficiază de legislaţia privitoare la accidentele de muncă pe toată durata efectuării pregătirii practice.\n" +
        "    (4) În cazul unui accident suportat de practicanţi, fie în cursul lucrului, fie în timpul deplasării la lucru, partenerul de practică se angajează să înştiinţeze asigurătorul cu privire la accidentul care a avut loc.",
        { align: "justify" }
      );
      doc.moveDown(0.5);

      // ART. 11
      doc.font(bold).fontSize(9.5).text("Art. 11 Confidențialitate");
      doc.font(regular).fontSize(9.2).text(
        "Organizatorul de practică se obligă:\n" +
        "să păstreze secretul și confidențialitatea tuturor INFORMAȚIILOR primite sau care i-au fost puse la dispoziție de către partenerul de practică și să împiedice orice divulgare a acestor INFORMAȚII unor terțe părți;\n" +
        "să limiteze în cadrul instituției circulația INFORMAȚIILOR doar către persoane a căror activitate justifică divulgarea acestora și să se asigure că aceste persoane au înțeles pe deplin obligația lor de a păstra secretul și de a restrânge utilizarea acestor INFORMAȚII în scopurile definite în cadrul prezentei convenții;\n" +
        "să nu divulge INFORMAȚIILE către terțe părți fără a fi obținut acordul scris din partea partenerului de practică și fără angajamentul valid al terțelor părți că vor păstra confidențialitatea INFORMAȚIILOR;\n" +
        "să nu utilizeze INFORMAȚIILE în alt scop decât cel ce formează obiectul convenției, fără acordul scris prealabil dat de partenerul de practică;\n" +
        "să nu reproducă nici integral nici parțial, indiferent sub ce formă se găsesc ele, în documentele sale publicitare,  sau, în mod general, prin niciun mijloc de comunicare  INFORMAȚIILE legate de produsele sub marca folosită de către partenerul de practică și/sau de către clienții acestuia sau sub o alta marcă, fapt ce ar reprezenta o încălcare a legilor privind proprietatea intelectuală și constituie infracțiunea de contrafacere;\n" +
        "să nu reproducă și să nu publice nici un material, ofertă, broșură, reclamă sau orice fel de formă de publicitate, marketing, comunicare electronică sau înscris, indiferent de formă sau suport, în care să folosească numele, marca, emblema sau orice alt atribut de proprietate intelectuală utilizat de către partenerul de practică și/sau de către clienții acestuia și/sau grupul de firme din care face parte partenerul de practică,  fără a obtine acordul scris, expres și prealabil dat de partenerul de practică.",
        { align: "justify" }
      );
      doc.moveDown(0.5);

      // ART. 12
      doc.font(bold).fontSize(9.5).text("    ART. 12    Prevederi finale");
      doc.font(regular).fontSize(9.2).text(
        "(1) Modificarea prezentei convenţii se face numai prin act adiţional încheiat între părţile contractante.\n" +
        "(2) Prezenta convenţie reprezintă voinţa părţilor şi înlătură orice altă înţelegere verbală dintre acestea, anterioară sau ulterioară încheierii ei.\n" +
        "(3) Soluţionarea neînţelegerilor se efectuează pe cale amiabilă, în caz contrar, de instanţele judecătoreşti competente.\n" +
        "(4) Anexele 1-2 fac parte integrantă din prezenta convenţie.\n" +
        "    Prezenta convenţie s-a încheiat azi, în două exemplare originale, cu aceeaşi valoare juridică.",
        { align: "justify" }
      );
      doc.moveDown(0.8);

      // Semnături Convenție-cadru
      drawSignaturesBlock(doc, regular, bold, data.decanName, data.companyName, data.legalRepresentative);

      // ─────────────────────────────────────────────────────────────────────────
      // SECȚIUNEA 2: ANEXA 1 - PORTOFOLIU DE PRACTICĂ (Pagină nouă obligatorie)
      // ─────────────────────────────────────────────────────────────────────────
      doc.addPage();

      doc.font(bold).fontSize(10).fillColor("#000000").text("ANEXĂ 1", { align: "left" });
      doc.font(regular).fontSize(9.5).text(`la convenţia nr ${data.conventionNumber || "…………………."}`, { align: "left" });
      doc.moveDown(0.3);

      doc.font(bold).fontSize(11).text("PORTOFOLIU DE PRACTICĂ", { align: "center" });
      doc.font(regular).fontSize(9.5).text(`la Convenţia privind efectuarea stagiului de practică nr. ${data.conventionNumber || "......................."}`, { align: "center" });
      doc.moveDown(0.8);

      const itemsAnexa1 = [
        "    1. Durata totală a pregătirii practice: 90 ore/semestru",
        `    2. Calendarul pregătirii: ${data.workSchedule || "luni-vineri"}`,
        `    3. Perioada stagiului, timpul de lucru şi orarul (de precizat zilele de pregătire practică în cazul timpului de lucru parţial): ${data.periodStart || "05.07.2027"} – ${data.periodEnd || "25.07.2027"}, ${data.dailyHours || 6} ore/zi, interval orar 09:00 - 15:00`,
        `    4. Adresa unde se va derula stagiul de pregătire practică: ${data.locationAddress || data.companyAddress || ".................................................................."}`,
        "    5. Deplasarea în afara locului unde este repartizat practicantul vizează următoarele locaţii:................................ nu este cazul .........................",
        "    6. Condiţii de primire a studenţilor în stagiul de practică – conform reglementărilor existente în legătură cu prevenirea răspândirii COVID19",
        "    7. Modalităţi prin care se asigură complementaritatea între pregătirea dobândită de studenţi în instituţia de învăţământ superior şi în cadrul stagiului de practică: - completarea caietului/raportului de practică",
        `    8. Numele şi prenumele cadrelor  didactice care asigură supravegherea pedagogică a practicantului pe perioada stagiului de practică: ${data.supervisorName || "........................................"}`,
        "    9. Drepturi şi responsabilităţi ale cadrului didactic din unitatea de învăţământ - organizator al practicii, pe perioada stagiului de practică: - să monitorizeze și evalueze stagiul de practică desfășurat de către student/ți",
        `    10. Numele şi prenumele tutorelui/tutorilor  desemnat/i de societate care va asigura respectarea condiţiilor de pregătire şi dobândirea de către practicant a competenţelor profesionale planificate pentru perioada stagiului de practică: ${data.tutorName || "..........................................................................................."}`,
        "    11. Drepturi şi responsabilităţi ale tutorelui de practică desemnat de partenerul de practică: să asigure respectarea condițiilor de pregătire şi dobândire de către practicant a competenţelor profesionale planificate pentru perioada stagiului de practică.",
        "    12. Definirea competenţelor care vor fi dobândite pe perioada stagiului de practică",
      ];

      doc.font(regular).fontSize(9).fillColor("#000000");
      for (const item of itemsAnexa1) {
        doc.text(item, { align: "justify" });
        doc.moveDown(0.2);
      }
      doc.moveDown(0.4);

      // Tabel competențe (punctul 12) exact ca în docx
      const compColW = [35, 120, 110, 65, 115, 50];
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
          "Competenţe atitudinale\nCooperarea eficientă în echipe de lucru profesionale, interdisciplinare, specifice desfășurării proiectelor din domeniu. Manifestarea unor atitudini pozitive, specifice incluziunii sociale prin abordarea diversității ca resursă în mediul educațional și social. Manifestarea unei atitudini pozitive, active, creative, reflexive și a spiritului critic față de profesia de inginer.",
          "Participarea colaborativă în activităţi de echipă.",
          "",
          "Activități care să dezvolte competenţele cerute.",
          "",
        ],
      ];

      const compTableEndY = drawTable(doc, regular, bold, leftMargin, doc.y, compColW, compHeaders, compRows, 7.5);
      doc.y = compTableEndY + 8;

      // Punctul 13
      doc.font(regular).fontSize(9).fillColor("#000000").text(
        "13. Modalităţi de evaluare a pregătirii profesionale dobândite de practicanţi pe perioada stagiului de pregătire practică"
      );
      doc.moveDown(0.3);

      const evalColW = [160, 165, 170];
      const evalHeaders = ["", "Nume și prenume", "Funcție", "Semnătura"];
      // 4 columns:
      const eval4ColW = [120, 150, 125, 100];
      const evalRows = [
        ["Cadru didactic supervizor", data.supervisorName || "", data.supervisorRole || "Cadru didactic", ""],
        ["Tutore", data.tutorName || "", data.tutorRole || "Tutore practică", ""],
        ["Practicant", data.studentName || "", `Student an ${data.studyYear || "III"}`, ""],
        ["Data", data.dateStr || new Date().toLocaleDateString("ro-RO"), "", ""],
      ];

      const evalTableEndY = drawTable(doc, regular, bold, leftMargin, doc.y, eval4ColW, ["", "Nume și prenume", "Funcție", "Semnătura"], evalRows, 8);
      doc.y = evalTableEndY + 10;

      // Semnături Anexa 1
      drawSignaturesBlock(doc, regular, bold, data.decanName, data.companyName, data.legalRepresentative);

      // ─────────────────────────────────────────────────────────────────────────
      // SECȚIUNEA 3: ANEXA 2 - TABEL NOMINAL (Pagină nouă obligatorie)
      // ─────────────────────────────────────────────────────────────────────────
      doc.addPage();

      doc.font(bold).fontSize(10).fillColor("#000000").text("ANEXĂ 2", { align: "left" });
      doc.font(regular).fontSize(9.5).text(`la convenţia nr ${data.conventionNumber || "…………………."}`, { align: "left" });
      doc.moveDown(0.5);

      doc.font(bold).fontSize(11).text("TABEL NOMINAL", { align: "center" });
      doc.font(regular).fontSize(9.5).text(
        `Cuprinzând studenţii anilor  ${data.studyYear ? `II, III (anul ${data.studyYear})` : "....................."}, an universitar 2026-2027, specializarea ${data.specialization || "........................................"},  Facultatea de Inginerie, care vor efectua stagiul de practică la partenerul de practică`,
        { align: "center" }
      );
      doc.font(bold).fontSize(10).text(data.companyName || "....................................................................", { align: "center" });
      doc.moveDown(0.8);

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
          data.studentName || "",
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

      const nominalTableEndY = drawTable(doc, regular, bold, leftMargin, doc.y, nominalColW, nominalHeaders, nominalRows, 8);
      doc.y = nominalTableEndY + 15;

      // Semnături Anexa 2
      drawSignaturesBlock(doc, regular, bold, data.decanName, data.companyName, data.legalRepresentative);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
