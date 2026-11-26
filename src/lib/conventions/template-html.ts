import path from "path";
import fs from "fs";
import { ConventionData } from "./types";

function toTitleCase(str: string | undefined | null): string {
  if (!str) return "";
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatCompanyAddress(address: string | undefined | null): string {
  if (!address || !address.trim()) return "Str. .......................";
  const trimmed = address.trim();
  if (/^(str\.|strada|bd\.|bulevardul|calea|soseaua|șos\.)/i.test(trimmed)) {
    return trimmed;
  }
  return `Str. ${trimmed}`;
}

let cachedLogoBase64: string | null = null;
function getLogoBase64(): string {
  if (cachedLogoBase64) return cachedLogoBase64;
  try {
    const p = path.join(process.cwd(), "src/lib/conventions/assets/ulbs-logo.png");
    if (fs.existsSync(p)) {
      cachedLogoBase64 = fs.readFileSync(p).toString("base64");
      return cachedLogoBase64;
    }
  } catch {}
  return "";
}

/**
 * Generează documentul HTML complet pentru Convenția de Practică ULBS
 * cu suport 100% UTF-8 pentru toate diacriticele românești (ă, â, î, ș, ț).
 * Formatat A4 identic cu documentul oficial Word (.docx) al Facultății de Inginerie ULBS.
 */
export function generateConventionHtml(data: ConventionData): string {
  const dateFormatted = data.dateStr || new Date().toLocaleDateString("ro-RO");
  const logoBase64 = getLogoBase64();
  const regComText = data.regCom ? `sub nr. ${data.regCom}` : "sub nr. ............................";
  const bankAccountVal = data.bankAccount || "....................................";
  const bankNameVal = data.bankName || "...............................";
  const bankText = `Cont bancar nr. ${bankAccountVal} deschis la ${bankNameVal}`;
  const repText = data.legalRepresentative || "...................................................................................";

  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="keywords" content="CONVENȚIE, CONVENŢIE, ANEXA 1, ANEXĂ 1, ANEXA 2, ANEXĂ 2, ROMÂNIA, ÎNVĂȚĂMÂNT, ȘCOALĂ, ȚARĂ">
  <title>Convenție privind efectuarea stagiului de practică - ${data.conventionNumber || "ULBS"}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 18mm 15mm 18mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 11pt;
      line-height: 1.35;
      color: #000000;
      background: #ffffff;
      margin: 0;
      padding: 20px 30px;
    }
    .page-break {
      page-break-before: always;
      break-before: page;
      margin-top: 2rem;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-justify { text-align: justify; }
    .font-bold { font-weight: bold; }
    .title-main {
      font-size: 13pt;
      font-weight: bold;
      margin-bottom: 2px;
    }
    .subtitle-main {
      font-size: 11.5pt;
      font-weight: bold;
      margin-bottom: 4px;
    }
    .article-title {
      font-weight: bold;
      margin-top: 10px;
      margin-bottom: 3px;
    }
    p {
      margin-top: 4px;
      margin-bottom: 4px;
      text-align: justify;
    }
    .table-custom {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: 9.5pt;
    }
    .table-custom th, .table-custom td {
      border: 1px solid #000000;
      padding: 4px 6px;
      vertical-align: top;
      color: #000000;
    }
    .table-custom th {
      font-weight: bold;
      text-align: center;
    }
    .signatures-block {
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
    .signature-side {
      width: 48%;
      line-height: 1.35;
    }
    .anexa-header {
      font-weight: bold;
      font-size: 11pt;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>

  <!-- ANTET OFICIAL CU LOGO ULBS -->
  <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px; border-bottom: 2px solid #0b2f63; padding-bottom: 6px;">
    ${logoBase64 ? `<img src="data:image/png;base64,${logoBase64}" alt="ULBS Logo" style="height: 42px;" />` : `<div style="font-weight: bold; color: #0b2f63;">ULBS</div>`}
    <div style="text-align: right; font-size: 8.5pt; color: #0b2f63; line-height: 1.3;">
      <strong>Ministerul Educației și Cercetării</strong><br>
      Universitatea „Lucian Blaga” din Sibiu<br>
      Facultatea de Inginerie
    </div>
  </div>

  <!-- CONVENȚIE CADRU -->
  <div class="text-center" style="margin-bottom: 12px;">
    <div class="title-main">CONVENŢIE</div>
    <div class="subtitle-main">PRIVIND EFECTUAREA STAGIULUI DE PRACTICĂ</div>
    <div class="font-bold">NR. ${data.conventionNumber || "........................................."}</div>
  </div>

  <div>
    <p style="text-indent: 20px;">Prezenta convenţie se încheie între:</p>
    <p>
      <strong>${data.facultyName}</strong> din cadrul <strong>${data.universityName}</strong>, cu sediul în Sibiu, ${data.universityAddress}, reprezentată prin decan, <strong>${data.decanName}</strong>, numită în continuare <em>organizator de practică</em>,
    </p>
    <p class="text-center" style="margin: 4px 0;">şi</p>
    <p>
      <strong>${data.companyName || ".............................................................."}</strong>, cu sediul în ${data.companyCity || ".................................."}, ${formatCompanyAddress(data.companyAddress)}, înregistrată la Registrul Comerțului din ${data.companyCity || "........................."} ${regComText}, cod fiscal <strong>${data.cuiCif || ".............................."}</strong>, ${bankText}, reprezentată legal de către <strong>${repText}</strong>, în calitate de <em>partener de practică</em>,
    </p>
    <p>
      în temeiul Legii nr. 258/2007 privind practica elevilor şi studenţilor şi a Ordinului 3955/2008 privind aprobarea Cadrului general de organizare a stagiilor de practică în cadrul programelor de studii universitare de licență și de masterat și a Convenției-cadru privind efectuarea stagiului de practică în cadrul programelor de studii universitare de licență sau masterat.
    </p>

    <div class="article-title">ART. 1 Obiectul convenției</div>
    <p>(1) Convenţia stabileşte cadrul în care se organizează şi se desfăşoară stagiul de practică în vederea consolidării cunoştinţelor teoretice şi pentru formarea abilităţilor, spre a le aplica în concordanţă cu specializarea, studenţii anilor II, III de la Facultatea de Inginerie.</p>
    <p>(2) Stagiul de practică este realizat de studenţi în vederea dobândirii competenţelor profesionale menţionate în portofoliul de practică, parte integrantă a prezentei convenţii, şi a elaborării proiectului de diplomă.</p>
    <p>(3) Modalităţile de derulare şi conţinutul stagiului de pregătire practică sunt descrise în prezenta convenţie şi în portofoliul de practică cuprins în anexa la prezenta convenţie.</p>

    <div class="article-title">ART. 2    Statutul practicanţilor</div>
    <p>Practicanţii rămân, pe toată durata stagiului de pregătire practică, studenţi ai Universităţii „Lucian Blaga” din Sibiu.</p>

    <div class="article-title">ART. 3    Durata şi perioada desfăşurării stagiului de practică</div>
    <p>Stagiul de practică se va desfăşura în perioada  ${data.periodStart || "01.07.2026"} – ${data.periodEnd || "30.09.2026"}.</p>

    <div class="article-title">ART. 4    Responsabilităţile practicanţilor</div>
    <p>(1) Practicanţii au obligaţia ca, pe durata derulării stagiului de practică, să respecte programul de lucru stabilit şi să execute activităţile specificate de tutore în conformitate cu portofoliul de practică, în condiţiile respectării cadrului legal cu privire la volumul şi dificultatea acestora.</p>
    <p>(2) Pe durata stagiului, practicanţii respectă regulamentul de ordine interioară al partenerului de practică. În cazul nerespectării acestui regulament, conducătorul partenerului de practică îşi rezervă dreptul de a anula convenţia, după ce în prealabil a ascultat punctul de vedere al practicantului şi al tutorelui şi a înştiinţat conducătorul instituţiei de învăţământ şi după primirea confirmării de primire a acestei informaţii.</p>
    <p>(3) Practicanţii au obligaţia de a respecta normele de securitate şi sănătate în muncă pe care şi le-au însuşit de la reprezentantul partenerului de practică înainte de începerea stagiului de practică.</p>
    <p>(4) De asemenea, practicanţii se angajează să nu folosească, în niciun caz, informaţiile la care au acces în timpul stagiului despre partenerul de practică sau clienţii săi, pentru a le comunica unui terţ sau pentru a le publica, chiar după terminarea stagiului, decât cu acordul respectivului partener de practică.</p>

    <div class="article-title">ART. 5    Responsabilităţile partenerului de practică</div>
    <p>(1) Partenerul de practică va stabili un tutore pentru stagiul de practică, selectat dintre salariaţii proprii şi ale cărui obligaţii sunt menţionate în portofoliul de practică.</p>
    <p>(2) În cazul nerespectării obligaţiilor de către practicant/practicanţi, tutorele va contacta cadrul didactic supervizor, aplicându-se sancţiuni conform regulamentului de organizare şi funcţionare al Universităţii “Lucian Blaga” Sibiu, Facultatea de Inginerie.</p>
    <p>(3) Înainte de începerea stagiului de practică, partenerul are obligaţia de a face practicanţilor instructajul cu privire la normele de securitate şi sănătate în muncă, în conformitate cu legislaţia în vigoare. Printre responsabilităţile sale, partenerul de practică va lua măsurile necesare pentru securitatea şi sănătatea în muncă a practicanţilor, precum şi pentru comunicarea regulilor de prevenire asupra riscurilor profesionale.</p>
    <p>(4) Partenerul de practică are următoarele atribuţii: elaborează proiectele necesare realizării practicii de specialitate;</p>
    <p>(5) Partenerul de practică trebuie să pună la dispoziţia practicanţilor toate mijloacele necesare pentru dobândirea competenţelor precizate în portofoliul de practică pentru studenţii Facultăţii de Inginerie.</p>
    <p>(6) Partenerul de practică are obligaţia de a asigura practicanţilor accesul liber la serviciul de medicina muncii, pe durata derulării pregătirii practice.</p>

    <div class="article-title">ART. 6    Obligaţiile organizatorului de practică</div>
    <p>(1) Organizatorul de practică desemnează un cadru didactic supervizor, responsabil cu planificarea, organizarea şi supravegherea desfăşurării pregătirii practice. Cadrul didactic supervizor, împreună cu tutorele desemnat de partenerul de practică, stabilesc tematica de practică şi competenţele profesionale care fac obiectul stagiului de pregătire practică.</p>
    <p>(2) În cazul în care derularea stagiului de pregătire practică nu este conformă cu angajamentele luate de către partenerul de practică în cadrul prezentei convenţii, conducătorul instituţiei de învăţământ superior poate decide întreruperea stagiului de pregătire practică conform convenţiei, după informarea prealabilă a conducătorului partenerului de practică şi după primirea confirmării de primire a acestei informaţii.</p>
    <p>(3) În urma desfăşurării cu succes a stagiului de practică, organizatorul va acorda practicantului numărul de credite aferente.</p>

    <div class="article-title">ART. 7    Persoane desemnate de organizatorul de practică şi partenerul de practică</div>
    <p>Tutorii (persoanele care vor avea responsabilitatea practicantului din partea partenerului de practică):</p>
    <table class="table-custom">
      <tbody>
        <tr>
          <td style="width: 50%;">
            Dl/Dna ${data.tutorName || "...................................."}<br>
            Funcţia ${data.tutorRole || "Tutore de practică"}<br>
            Telefon ${data.tutorPhone || "................................"}<br>
            Email ${data.tutorEmail || "..................................."}
          </td>
          <td style="width: 50%;">
            Dl/Dna ....................................<br>
            Funcţia .................................<br>
            Telefon ................................<br>
            Email ...................................
          </td>
        </tr>
      </tbody>
    </table>
    <p>
      (2) Cadrul didactic supervizor, responsabil cu urmărirea derulării stagiului de practică din partea organizatorului de practică:<br>
      Dl/Dna ${data.supervisorName || "............................................"}<br>
      Funcţia ${data.supervisorRole || "Cadru didactic supervizor"}<br>
      Telefon ${data.supervisorPhone || "0269/217928"}<br>
      Email: ${data.supervisorEmail || ".............................@ulbsibiu.ro"}
    </p>

    <div class="article-title">ART. 8    Evaluarea stagiului de pregătire practică prin credite transferabile</div>
    <p>Numărul de credite transferabile ce vor fi obţinute în urma desfăşurării stagiului de practică este de ${data.creditsCount || 4} credite.</p>

    <div class="article-title">ART. 9    Raportul privind stagiul de pregătire practică</div>
    <p>(1) În timpul derulării stagiului de practică, tutorele împreună cu cadrul didactic supervizor vor evalua practicantul în permanenţă, pe baza unei fişe de observaţie/evaluare. Vor fi evaluate atât nivelul de dobândire a competenţelor profesionale, cât şi comportamentul şi modalitatea de integrare a practicantului în activitatea partenerului de practică (disciplină, punctualitate, responsabilitate în rezolvarea sarcinilor, respectarea regulamentului de ordine interioară al societăţăţii etc.).</p>
    <p>(2) La finalul stagiului de practică, tutorele elaborează un raport, pe baza evaluării nivelului de dobândire a competenţelor de către practicant/practicanţi. Rezultatul acestei evaluări va sta la baza notării practicantului de către cadrul didactic supervizor.</p>
    <p>(3) Periodic şi după încheierea stagiului de practică, practicanţii vor prezenta un caiet de practică care va cuprinde:</p>
    <ul style="margin: 4px 0 4px 20px;">
      <li>denumirea modulului de pregătire;</li>
      <li>competenţe exersate;</li>
      <li>activităţi desfăşurate pe perioada stagiului de practică;</li>
      <li>observaţii personale privitoare la activitatea depusă.</li>
    </ul>

    <div class="article-title">ART. 10    Sănătatea şi securitatea în muncă. Protecţia socială a practicanţilor</div>
    <p>(1) Partenerul de practică are obligaţia respectării prevederilor legale cu privire la sănătatea şi securitatea în muncă a practicanţilor pe durata stagiului de practică.</p>
    <p>(2) Practicanţilor li se asigură protecţie socială conform legislaţiei în vigoare. Ca urmare, conform dispoziţiilor Legii nr. 346/2002 privind asigurările pentru accidente de muncă şi boli profesionale, cu modificările şi completările ulterioare, practicanţii beneficiază de legislaţia privitoare la accidentele de muncă pe toată durata efectuării pregătirii practice.</p>
    <p>(4) În cazul unui accident suportat de practicanţi, fie în cursul lucrului, fie în timpul deplasării la lucru, partenerul de practică se angajează să înştiinţeze asigurătorul cu privire la accidentul care a avut loc.</p>

    <div class="article-title">Art. 11 Confidențialitate</div>
    <p>Organizatorul de practică se obligă:</p>
    <p>să păstreze secretul și confidențialitatea tuturor INFORMAȚIILOR primite sau care i-au fost puse la dispoziție de către partenerul de practică și să împiedice orice divulgare a acestor INFORMAȚII unor terțe părți;</p>
    <p>să limiteze în cadrul instituției circulația INFORMAȚIILOR doar către persoane a căror activitate justifică divulgarea acestora și să se asigure că aceste persoane au înțeles pe deplin obligația lor de a păstra secretul și de a restrânge utilizarea acestor INFORMAȚII în scopurile definite în cadrul prezentei convenții;</p>
    <p>să nu divulge INFORMAȚIILE către terțe părți fără a fi obținut acordul scris din partea partenerului de practică și fără angajamentul valid al terțelor părți că vor păstra confidențialitatea INFORMAȚIILOR;</p>
    <p>să nu utilizeze INFORMAȚIILE în alt scop decât cel ce formează obiectul convenției, fără acordul scris prealabil dat de partenerul de practică;</p>
    <p>să nu reproducă nici integral nici parțial, indiferent sub ce formă se găsesc ele, în documentele sale publicitare, sau, în mod general, prin niciun mijloc de comunicare INFORMAȚIILE legate de produsele sub marca folosită de către partenerul de practică și/sau de către clienții acestuia sau sub o alta marcă, fapt ce ar reprezenta o încălcare a legilor privind proprietatea intelectuală și constituie infracțiunea de contrafacere;</p>
    <p>să nu reproducă și să nu publice nici un material, ofertă, broșură, reclamă sau orice fel de formă de publicitate, marketing, comunicare electronică sau înscris, indiferent de formă sau suport, în care să folosească numele, marca, emblema sau orice alt atribut de proprietate intelectuală utilizat de către partenerul de practică și/sau de către clienții acestuia și/sau grupul de firme din care face parte partenerul de practică, fără a obtine acordul scris, expres și prealabil dat de partenerul de practică.</p>

    <div class="article-title">ART. 12 Prevederi finale</div>
    <p>(1) Modificarea prezentei convenţii se face numai prin act adiţional încheiat între părţile contractante.</p>
    <p>(2) Prezenta convenţie reprezintă voinţa părţilor şi înlătură orice altă înţelegere verbală dintre acestea, anterioară sau ulterioară încheierii ei.</p>
    <p>(3) Soluţionarea neînţelegerilor se efectuează pe cale amiabilă, în caz contrar, de instanţele judecătoreşti competente.</p>
    <p>(4) Anexele 1-2 fac parte integrantă din prezenta convenţie.</p>
    <p style="text-indent: 20px;">Prezenta convenţie s-a încheiat azi, în două exemplare originale, cu aceeaşi valoare juridică.</p>

    <div class="signatures-block">
      <div class="signature-side">
        <strong>Organizator de practică</strong><br>
        Facultatea de Inginerie<br>
        Decan,<br>
        <strong>Prof.univ.dr.ing. Maria VINŢAN</strong>
      </div>
      <div class="signature-side text-right">
        <strong>Partener de practică</strong><br>
        ${data.companyName || "........................................................"}<br>
        Director,<br>
        <strong>${data.legalRepresentative || ""}</strong>
      </div>
    </div>
  </div>

  <!-- ANEXA 1: PORTOFOLIU DE PRACTICĂ -->
  <div class="page-break">
    <div class="anexa-header">
      ANEXĂ 1<br>
      <span style="font-weight: normal; font-size: 10pt;">la convenţia nr ${data.conventionNumber || "…………………."}</span>
    </div>

    <div class="text-center" style="margin-bottom: 12px;">
      <div class="title-main">PORTOFOLIU DE PRACTICĂ</div>
      <div style="font-size: 10pt;">la Convenţia privind efectuarea stagiului de practică nr. ${data.conventionNumber || "......................."}</div>
    </div>

    <p>1. Durata totală a pregătirii practice: 90 ore/semestru</p>
    <p>2. Calendarul pregătirii: ${data.workSchedule || "luni-vineri"}</p>
    <p>3. Perioada stagiului, timpul de lucru şi orarul (de precizat zilele de pregătire practică în cazul timpului de lucru parţial): ${data.periodStart || "01.07.2026"} – ${data.periodEnd || "30.09.2026"}, ${data.dailyHours || 6} ore/zi, interval orar 09:00 - 15:00</p>
    <p>4. Adresa unde se va derula stagiul de pregătire practică: ${data.locationAddress || data.companyAddress || ".................................................................."}</p>
    <p>5. Deplasarea în afara locului unde este repartizat practicantul vizează următoarele locaţii: .................. nu este cazul ..................</p>
    <p>6. Condiţii de primire a studenţilor în stagiul de practică – conform reglementărilor existente în legătură cu prevenirea răspândirii COVID19</p>
    <p>7. Modalităţi prin care se asigură complementaritatea între pregătirea dobândită de studenţi în instituţia de învăţământ superior şi în cadrul stagiului de practică: - completarea caietului/raportului de practică</p>
    <p>8. Numele şi prenumele cadrelor  didactice care asigură supravegherea pedagogică a practicantului pe perioada stagiului de practică: ${data.supervisorName || "........................................"}</p>
    <p>9. Drepturi şi responsabilităţi ale cadrului didactic din unitatea de învăţământ - organizator al practicii, pe perioada stagiului de practică: - să monitorizeze și evalueze stagiul de practică desfășurat de către student/ți</p>
    <p>10. Numele şi prenumele tutorelui/tutorilor  desemnat/i de societate care va asigura respectarea condiţiilor de pregătire şi dobândirea de către practicant a competenţelor profesionale planificate pentru perioada stagiului de practică: ${data.tutorName || "..........................................................................................."}</p>
    <p>11. Drepturi şi responsabilităţi ale tutorelui de practică desemnat de partenerul de practică: să asigure respectarea condițiilor de pregătire şi dobândire de către practicant a competenţelor profesionale planificate pentru perioada stagiului de practică.</p>
    <p>12. Definirea competenţelor care vor fi dobândite pe perioada stagiului de practică</p>

    <table class="table-custom">
      <thead>
        <tr>
          <th style="width: 8%;">Nr. Crt</th>
          <th style="width: 28%;">Competența</th>
          <th style="width: 24%;">Modul de pregătire</th>
          <th style="width: 14%;">Locul de muncă</th>
          <th style="width: 18%;">Activități planificate</th>
          <th style="width: 8%;">Observații</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="text-center">1</td>
          <td><strong>Competenţe privind cunoaşterea şi înţelegerea</strong><br>Utilizarea cunoştinţelor din domeniu în proiectarea activităţilor. Elaborarea de proiecte specifice domeniului în care să utilizeze concepte, teorii, modele.</td>
          <td>Participare activă la sarcinile programate conform caietului de practică.</td>
          <td>........</td>
          <td>Activități care să dezvolte competenţele cerute.</td>
          <td>.</td>
        </tr>
        <tr>
          <td class="text-center">2</td>
          <td><strong>Competenţe în domeniul explicării şi interpretării</strong><br>Explicarea și interpretarea fenomenelor din domeniu pe baza conceptelor, teoriilor și modelelor însușite. Stabilirea unor relații și conexiuni între cunoștințele și informațiile din domeniu.</td>
          <td>Implicarea studenţilor în vederea realizării conexiunii între teorie și practică.</td>
          <td>.............</td>
          <td>Activităţi care să dezvolte competenţele cerute.</td>
          <td></td>
        </tr>
        <tr>
          <td class="text-center">3</td>
          <td><strong>Competenţe instrumental - aplicative</strong><br>Aplicarea fenomenelor din domeniu pe baza conceptelor, teoriilor și modelelor însușite. Experimentarea unor fenomene specifice domeniului.</td>
          <td>Implicarea în rezolvarea sarcinilor încredințate de organizație.</td>
          <td></td>
          <td>Activități care să dezvolte competenţele cerute.</td>
          <td></td>
        </tr>
        <tr>
          <td class="text-center">4</td>
          <td><strong>Competenţe atitudinale</strong><br>Cooperarea eficientă în echipe de lucru profesionale, interdisciplinare, specifice desfășurării proiectelor din domeniu. Manifestarea unor atitudini pozitive, specifice incluziunii sociale prin abordarea diversității ca resursă în mediul educațional și social. Manifestarea unei atitudini pozitive, active, creative, reflexive și a spiritului critic față de profesia de inginer.</td>
          <td>Participarea colaborativă în activităţi de echipă.</td>
          <td></td>
          <td>Activități care să dezvolte competenţele cerute.</td>
          <td></td>
        </tr>
      </tbody>
    </table>

    <div class="article-title" style="margin-top: 10px;">13. Modalităţi de evaluare a pregătirii profesionale dobândite de practicanţi pe perioada stagiului de pregătire practică</div>
    <table class="table-custom">
      <thead>
        <tr>
          <th></th>
          <th>Nume și prenume</th>
          <th>Funcție</th>
          <th>Semnătura</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Cadru didactic supervizor</strong></td>
          <td>${data.supervisorName || ""}</td>
          <td>${data.supervisorRole || "Cadru didactic"}</td>
          <td></td>
        </tr>
        <tr>
          <td><strong>Tutore</strong></td>
          <td>${data.tutorName || ""}</td>
          <td>${data.tutorRole || "Tutore practică"}</td>
          <td></td>
        </tr>
        <tr>
          <td><strong>Practicant</strong></td>
          <td>${toTitleCase(data.studentName) || ""}</td>
          <td>Student an ${data.studyYear || "III"}</td>
          <td></td>
        </tr>
        <tr>
          <td><strong>Data</strong></td>
          <td>${data.dateStr || dateFormatted}</td>
          <td></td>
          <td></td>
        </tr>
      </tbody>
    </table>

    <div class="signatures-block" style="margin-top: 25px;">
      <div class="signature-side">
        <strong>Organizator de practică</strong><br>
        Facultatea de Inginerie<br>
        Decan,<br>
        <strong>Prof.univ.dr.ing. Maria VINŢAN</strong>
      </div>
      <div class="signature-side text-right">
        <strong>Partener de practică</strong><br>
        ${data.companyName || "........................................................"}<br>
        Director,<br>
        <strong>${data.legalRepresentative || ""}</strong>
      </div>
    </div>
  </div>

  <!-- ANEXA 2: TABEL NOMINAL -->
  <div class="page-break">
    <div class="anexa-header">
      ANEXĂ 2<br>
      <span style="font-weight: normal; font-size: 10pt;">la convenţia nr ${data.conventionNumber || "…………………."}</span>
    </div>

    <div class="text-center" style="margin-bottom: 12px;">
      <div class="title-main">TABEL NOMINAL</div>
      <p style="margin: 4px 0; font-size: 10.5pt;">
        Cuprinzând studenţii anului ${data.studyYear || "............"}, an universitar 2026-2027, specializarea <strong>${data.specialization || "........................................"}</strong>,  Facultatea de Inginerie, care vor efectua stagiul de practică la partenerul de practică
      </p>
      <p style="margin: 4px 0; font-weight: bold;">
        ${data.companyName || "...................................................................."}
      </p>
    </div>

    <table class="table-custom">
      <thead>
        <tr>
          <th style="width: 28%;">Nume si prenume student</th>
          <th style="width: 12%;">Grupa</th>
          <th style="width: 20%;">Semnatura student</th>
          <th style="width: 22%;">Cadru didactic coordonator</th>
          <th style="width: 18%;">Semnatura cadru didactic coordonator</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>${toTitleCase(data.studentName) || ""}</strong></td>
          <td class="text-center">${data.group || ""}</td>
          <td></td>
          <td>${data.supervisorName || ""}</td>
          <td></td>
        </tr>
        <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>
      </tbody>
    </table>

    <div class="signatures-block" style="margin-top: 30px;">
      <div class="signature-side">
        <strong>Organizator de practică</strong><br>
        Facultatea de Inginerie<br>
        Decan,<br>
        <strong>Prof.univ.dr.ing. Maria VINŢAN</strong>
      </div>
      <div class="signature-side text-right">
        <strong>Partener de practică</strong><br>
        ${data.companyName || "........................................................"}<br>
        Director,<br>
        <strong>${data.legalRepresentative || ""}</strong>
      </div>
    </div>
  </div>

</body>
</html>
`;
}
