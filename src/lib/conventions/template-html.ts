import { ConventionData } from "./types";

/**
 * Generează documentul HTML complet pentru Convenția de Practică ULBS
 * cu suport 100% UTF-8 pentru toate diacriticele românești (ă, â, î, ș, ț).
 * Formatat A4 print-ready conform standardelor Facultății de Inginerie ULBS.
 */
export function generateConventionHtml(data: ConventionData): string {
  const dateFormatted = data.dateStr || new Date().toLocaleDateString("ro-RO");

  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>Convenție de Practică ULBS - ${data.conventionNumber}</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 15mm 18mm 15mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Liberation Sans", "DejaVu Sans", Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.45;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 0;
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
    .uppercase { text-transform: uppercase; }
    .underline-dots {
      border-bottom: 1px dotted #475569;
      display: inline-block;
      min-width: 120px;
      font-weight: 600;
      color: #0f172a;
      padding: 0 4px;
    }
    .title-main {
      font-size: 13pt;
      font-weight: 800;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .subtitle-main {
      font-size: 11pt;
      font-weight: 700;
      margin-bottom: 12px;
    }
    .article-title {
      font-weight: bold;
      margin-top: 10px;
      margin-bottom: 4px;
      color: #0f172a;
    }
    p {
      margin-top: 4px;
      margin-bottom: 6px;
      text-align: justify;
    }
    .table-custom {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 9.5pt;
    }
    .table-custom th, .table-custom td {
      border: 1px solid #475569;
      padding: 6px 8px;
      vertical-align: top;
    }
    .table-custom th {
      background-color: #f1f5f9;
      font-weight: 700;
      text-align: center;
    }
    .signatures-block {
      margin-top: 25px;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
    .signature-side {
      width: 48%;
      line-height: 1.4;
    }
    .signature-line {
      margin-top: 35px;
      border-top: 1px dashed #64748b;
      padding-top: 4px;
      font-size: 9pt;
      color: #64748b;
    }
    .anexa-header {
      text-align: right;
      font-weight: bold;
      font-size: 11pt;
      margin-bottom: 8px;
    }
  </style>
</head>
<body>

  <!-- ANTET OFICIAL ULBS -->
  <div class="text-center" style="margin-bottom: 12px; font-size: 8.5pt; font-weight: 700; color: #334155; letter-spacing: 0.8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">
    ROMÂNIA • MINISTERUL EDUCAȚIEI • UNIVERSITATEA „LUCIAN BLAGA” DIN SIBIU • FACULTATEA DE INGINERIE
  </div>

  <!-- CONVENȚIE CADRU -->
  <div class="text-center">
    <div class="title-main">CONVENȚIE</div>
    <div class="subtitle-main">PRIVIND EFECTUAREA STAGIULUI DE PRACTICĂ</div>
    <div class="font-bold">NR. <span class="underline-dots">${data.conventionNumber}</span></div>
  </div>

  <div style="margin-top: 14px;">
    <p>Prezenta convenție se încheie între:</p>
    <p>
      <strong>${data.facultyName}</strong> din cadrul <strong>${data.universityName}</strong>, cu sediul în Sibiu, ${data.universityAddress}, reprezentată prin decan, <strong>${data.decanName}</strong>, numită în continuare <em>organizator de practică</em>,
    </p>
    <p class="text-center font-bold" style="margin: 4px 0;">și</p>
    <p>
      <strong>${data.companyName}</strong>, cu sediul în ${data.companyCity}, Str. ${data.companyAddress}, înregistrată la Registrul Comerțului, cod fiscal <strong>${data.cuiCif}</strong>, Cont bancar nr. <span class="underline-dots">${data.bankAccount || "................................................"}</span> deschis la <span class="underline-dots">${data.bankName || "................................"}</span>, reprezentată legal de către <strong>${data.legalRepresentative}</strong>, în calitate de <em>partener de practică</em>,
    </p>
    <p>
      în temeiul Legii nr. 258/2007 privind practica elevilor și studenților și a Ordinului 3955/2008 privind aprobarea Cadrului general de organizare a stagiilor de practică în cadrul programelor de studii universitare de licență și de masterat și a Convenției-cadru privind efectuarea stagiului de practică în cadrul programelor de studii universitare de licență sau masterat.
    </p>

    <div class="article-title">ART. 1 Obiectul convenției</div>
    <p>
      (1) Convenția stabilește cadrul în care se organizează și se desfășoară stagiul de practică în vederea consolidării cunoștințelor teoretice și pentru formarea abilităților, spre a le aplica în concordanță cu specializarea <strong>${data.specialization}</strong>, studenții anului <strong>${data.studyYear}</strong> de la Facultatea de Inginerie.
    </p>
    <p>
      (2) Stagiul de practică este realizat de studenți în vederea dobândirii competențelor profesionale menționate în portofoliul de practică, parte integrantă a prezentei convenții, și a elaborării proiectului de diplomă (proiect: <em>${data.offerTitle}</em>).
    </p>
    <p>
      (3) Modalitățile de derulare și conținutul stagiului de pregătire practică sunt descrise în prezenta convenție și în portofoliul de practică cuprins în anexa la prezenta convenție.
    </p>

    <div class="article-title">ART. 2 Statutul practicanților</div>
    <p>
      Practicanții rămân, pe toată durata stagiului de pregătire practică, studenți ai Universității „Lucian Blaga” din Sibiu.
    </p>

    <div class="article-title">ART. 3 Durata și perioada desfășurării stagiului de practică</div>
    <p>
      Stagiul de practică se va desfășura în perioada <strong>${data.periodStart} – ${data.periodEnd}</strong>, având un volum total de <strong>${data.totalHours} ore</strong>.
    </p>

    <div class="article-title">ART. 4 Responsabilitățile practicanților</div>
    <p>
      (1) Practicanții au obligația ca, pe durata derulării stagiului de practică, să respecte programul de lucru stabilit și să execute activitățile specificate de tutore în conformitate cu portofoliul de practică, în condițiile respectării cadrului legal cu privire la volumul și dificultatea acestora.
    </p>
    <p>
      (2) Pe durata stagiului, practicanții respectă regulamentul de ordine interioară al partenerului de practică. În cazul nerespectării acestui regulament, conducătorul partenerului de practică își rezervă dreptul de a anula convenția, după ce în prealabil a ascultat punctul de vedere al practicantului și al tutorelui și a înștiințat conducătorul instituției de învățământ și după primirea confirmării de primire a acestei informații.
    </p>
    <p>
      (3) Practicanții au obligația de a respecta normele de securitate și sănătate în muncă pe care și le-au însușit de la reprezentantul partenerului de practică înainte de începerea stagiului de practică.
    </p>
    <p>
      (4) De asemenea, practicanții se angajează să nu folosească, în niciun caz, informațiile la care au acces în timpul stagiului despre partenerul de practică sau clienții săi, pentru a le comunica unui terț sau pentru a le publica, chiar după terminarea stagiului, decât cu acordul respectivului partener de practică.
    </p>

    <div class="article-title">ART. 5 Responsabilitățile partenerului de practică</div>
    <p>
      (1) Partenerul de practică va stabili un tutore pentru stagiul de practică, selectat dintre salariații proprii și ale cărui obligații sunt menționate în portofoliul de practică.
    </p>
    <p>
      (2) În cazul nerespectării obligațiilor de către practicant/practicanți, tutorele va contacta cadrul didactic supervizor, aplicându-se sancțiuni conform regulamentului de organizare și funcționare al Universității „Lucian Blaga” Sibiu, Facultatea de Inginerie.
    </p>
    <p>
      (3) Înainte de începerea stagiului de practică, partenerul are obligația de a face practicanților instructajul cu privire la normele de securitate și sănătate în muncă, în conformitate cu legislația în vigoare. Printre responsabilitățile sale, partenerul de practică va lua măsurile necesare pentru securitatea și sănătatea în muncă a practicanților, precum și pentru comunicarea regulilor de prevenire asupra riscurilor profesionale.
    </p>
    <p>
      (4) Partenerul de practică are următoarele atribuții: elaborează proiectele necesare realizării practicii de specialitate.
    </p>
    <p>
      (5) Partenerul de practică trebuie să pună la dispoziția practicanților toate mijloacele necesare pentru dobândirea competențelor precizate în portofoliul de practică pentru studenții Facultății de Inginerie.
    </p>
    <p>
      (6) Partenerul de practică are obligația de a asigura practicanților accesul liber la serviciul de medicina muncii, pe durata derulării pregătirii practice.
    </p>

    <div class="article-title">ART. 6 Obligațiile organizatorului de practică</div>
    <p>
      (1) Organizatorul de practică desemnează un cadru didactic supervizor, responsabil cu planificarea, organizarea și supravegherea desfășurării pregătirii practice. Cadrul didactic supervizor, împreună cu tutorele desemnat de partenerul de practică, stabilesc tematica de practică și competențele profesionale care fac obiectul stagiului de pregătire practică.
    </p>
    <p>
      (2) În cazul în care derularea stagiului de pregătire practică nu este conformă cu angajamentele luate de către partenerul de practică în cadrul prezentei convenții, conducătorul instituției de învățământ superior poate decide întreruperea stagiului de pregătire practică conform convenției.
    </p>
    <p>
      (3) În urma desfășurării cu succes a stagiului de practică, organizatorul va acorda practicantului numărul de credite aferente.
    </p>

    <div class="article-title">ART. 7 Persoane desemnate de organizatorul de practică și partenerul de practică</div>
    <p>
      (1) Tutorii (persoanele care vor avea responsabilitatea practicantului din partea partenerului de practică):<br>
      <strong>Dl/Dna:</strong> ${data.tutorName} &nbsp;|&nbsp; <strong>Funcția:</strong> ${data.tutorRole || "Tutore Practică"} &nbsp;|&nbsp; <strong>Telefon:</strong> ${data.tutorPhone || data.contactPhone || "-"} &nbsp;|&nbsp; <strong>Email:</strong> ${data.tutorEmail}
    </p>
    <p>
      (2) Cadrul didactic supervizor, responsabil cu urmărirea derulării stagiului de practică din partea organizatorului de practică:<br>
      <strong>Dl/Dna:</strong> ${data.supervisorName} &nbsp;|&nbsp; <strong>Funcția:</strong> Coordonator Practică &nbsp;|&nbsp; <strong>Telefon:</strong> ${data.supervisorPhone} &nbsp;|&nbsp; <strong>Email:</strong> ${data.supervisorEmail}
    </p>

    <div class="article-title">ART. 8 Evaluarea stagiului de pregătire practică prin credite transferabile</div>
    <p>
      Numărul de credite transferabile ce vor fi obținute în urma desfășurării stagiului de practică este de <strong>${data.creditsCount} credite</strong>.
    </p>

    <div class="article-title">ART. 9 Raportul privind stagiul de pregătire practică</div>
    <p>
      (1) În timpul derulării stagiului de practică, tutorele împreună cu cadrul didactic supervizor vor evalua practicantul în permanență, pe baza unei fișe de observație/evaluare.
    </p>
    <p>
      (2) La finalul stagiului de practică, tutorele elaborează un raport, pe baza evaluării nivelului de dobândire a competențelor de către practicant. Rezultatul acestei evaluări va sta la baza notării practicantului de către cadrul didactic supervizor.
    </p>
    <p>
      (3) Periodic și după încheierea stagiului de practică, practicanții vor prezenta un caiet de practică care va cuprinde: denumirea modulului de pregătire, competențe exersate, activități desfășurate pe perioada stagiului de practică și observații personale.
    </p>

    <div class="article-title">ART. 10 Sănătatea și securitatea în muncă. Protecția socială a practicanților</div>
    <p>
      (1) Partenerul de practică are obligația respectării prevederilor legale cu privire la sănătatea și securitatea în muncă a practicanților pe durata stagiului de practică.
    </p>
    <p>
      (2) Practicanților li se asigură protecție socială conform legislației în vigoare (Legea nr. 346/2002 privind asigurările pentru accidente de muncă și boli profesionale).
    </p>

    <div class="article-title">ART. 11 Confidențialitate</div>
    <p>
      Organizatorul de practică și practicantul se obligă să păstreze secretul și confidențialitatea tuturor informațiilor primite sau puse la dispoziție de către partenerul de practică și să împiedice orice divulgare a acestora unor terțe părți fără acord scris prealabil.
    </p>

    <div class="article-title">ART. 12 Prevederi finale</div>
    <p>
      (1) Modificarea prezentei convenții se face numai prin act adițional încheiat între părțile contractante.<br>
      (2) Anexele 1-2 fac parte integrantă din prezenta convenție.<br>
      Prezenta convenție s-a încheiat la data de <strong>${dateFormatted}</strong>, în două exemplare originale, cu aceeași valoare juridică.
    </p>

    <div class="signatures-block">
      <div class="signature-side">
        <strong>Organizator de practică</strong><br>
        ${data.facultyName}<br>
        Decan,<br>
        <strong>${data.decanName}</strong>
        <div class="signature-line">Semnătură și Ștampilă</div>
      </div>
      <div class="signature-side text-right">
        <strong>Partener de practică</strong><br>
        ${data.companyName}<br>
        Director / Reprezentant Legal,<br>
        <strong>${data.legalRepresentative}</strong>
        <div class="signature-line">Semnătură și Ștampilă</div>
      </div>
    </div>
  </div>

  <!-- ANEXA 1: PORTOFOLIU DE PRACTICĂ -->
  <div class="page-break">
    <div class="anexa-header">ANEXA 1<br><span style="font-size: 9.5pt; font-weight: normal;">la convenția nr. ${data.conventionNumber}</span></div>

    <div class="text-center" style="margin-bottom: 12px;">
      <div class="title-main">PORTOFOLIU DE PRACTICĂ</div>
      <div style="font-size: 10pt;">la Convenția privind efectuarea stagiului de practică nr. <strong>${data.conventionNumber}</strong></div>
    </div>

    <p><strong>1. Durata totală a pregătirii practice:</strong> ${data.totalHours} ore/semestru</p>
    <p><strong>2. Calendarul pregătirii:</strong> ${data.workSchedule}</p>
    <p><strong>3. Perioada stagiului, timpul de lucru și orarul:</strong> ${data.periodStart} – ${data.periodEnd}, ${data.dailyHours} ore/zi, interval orar 09:00 – 15:00</p>
    <p><strong>4. Adresa unde se va derula stagiul de pregătire practică:</strong> ${data.locationAddress}</p>
    <p><strong>5. Deplasarea în afara locului unde este repartizat practicantul vizează următoarele locații:</strong> nu este cazul</p>
    <p><strong>6. Condiții de primire a studenților în stagiul de practică:</strong> conform normelor universitare și regulamentului intern al partenerului de practică</p>
    <p><strong>7. Modalități prin care se asigură complementaritatea între pregătirea din facultate și practică:</strong> completarea caietului / raportului de practică și implicarea în proiecte reale din domeniul ingineresc</p>
    <p><strong>8. Numele și prenumele cadrului didactic supervizor:</strong> ${data.supervisorName} (Tel: ${data.supervisorPhone}, Email: ${data.supervisorEmail})</p>
    <p><strong>9. Drepturi și responsabilități ale cadrului didactic:</strong> monitorizarea și evaluarea stagiului de practică desfășurat de student</p>
    <p><strong>10. Numele și prenumele tutorelui desemnat de societate:</strong> ${data.tutorName} (Email: ${data.tutorEmail})</p>
    <p><strong>11. Drepturi și responsabilități ale tutorelui de practică:</strong> asigurarea respectării condițiilor de pregătire și dobândirii competențelor planificate</p>

    <div class="article-title" style="margin-top: 10px;">12. Definirea competențelor care vor fi dobândite pe perioada stagiului de practică:</div>
    <table class="table-custom">
      <thead>
        <tr>
          <th style="width: 25%;">Competența</th>
          <th style="width: 25%;">Modul de pregătire</th>
          <th style="width: 20%;">Locul de muncă</th>
          <th style="width: 30%;">Activități planificate</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Competențe privind cunoașterea și înțelegerea</strong><br>Utilizarea cunoștințelor din domeniu în proiectarea activităților. Elaborarea de proiecte specifice.</td>
          <td>Participare activă la sarcinile programate conform caietului de practică.</td>
          <td>Sediul partenerului / laborator</td>
          <td>Activități practice orientate pe proiectul: <em>${data.offerTitle}</em>.</td>
        </tr>
        <tr>
          <td><strong>Competențe în domeniul explicării și interpretării</strong><br>Explicarea și interpretarea fenomenelor și modelelor specifice domeniului ${data.specialization}.</td>
          <td>Implicarea studentului în realizarea conexiunii dintre teorie și practică.</td>
          <td>Departament tehnic</td>
          <td>Analiza arhitecturii tehnologice și a specificațiilor de implementare.</td>
        </tr>
        <tr>
          <td><strong>Competențe instrumental - aplicative</strong><br>Aplicarea conceptelor însușite, depanare, scriere cod și testare.</td>
          <td>Implicarea în rezolvarea sarcinilor încredințate de organizație.</td>
          <td>Post de lucru / echipă tehnică</td>
          <td>Dezvoltare, depanare și integrare în mediul de producție/test.</td>
        </tr>
        <tr>
          <td><strong>Competențe atitudinale</strong><br>Cooperare eficientă în echipe multidisciplinare, comunicare și etică profesională.</td>
          <td>Participarea colaborativă în activități de echipă.</td>
          <td>Echipa de proiect</td>
          <td>Sesiuni de planificare (daily standup), code review și feedback continuu.</td>
        </tr>
      </tbody>
    </table>

    <div class="article-title" style="margin-top: 10px;">13. Modalități de evaluare a pregătirii profesionale dobândite:</div>
    <table class="table-custom">
      <thead>
        <tr>
          <th>Nume și prenume</th>
          <th>Funcție</th>
          <th>Semnătura</th>
          <th>Data</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${data.supervisorName}</td>
          <td>Cadru didactic supervizor</td>
          <td></td>
          <td>${dateFormatted}</td>
        </tr>
        <tr>
          <td>${data.tutorName}</td>
          <td>Tutore de practică</td>
          <td></td>
          <td>${dateFormatted}</td>
        </tr>
        <tr>
          <td>${data.studentName}</td>
          <td>Practicant (Student)</td>
          <td></td>
          <td>${dateFormatted}</td>
        </tr>
      </tbody>
    </table>

    <div class="signatures-block">
      <div class="signature-side">
        <strong>Organizator de practică</strong><br>
        ${data.facultyName}<br>
        Decan, <strong>${data.decanName}</strong>
        <div class="signature-line">Semnătură și Ștampilă</div>
      </div>
      <div class="signature-side text-right">
        <strong>Partener de practică</strong><br>
        ${data.companyName}<br>
        Director, <strong>${data.legalRepresentative}</strong>
        <div class="signature-line">Semnătură și Ștampilă</div>
      </div>
    </div>
  </div>

  <!-- ANEXA 2: TABEL NOMINAL -->
  <div class="page-break">
    <div class="anexa-header">ANEXA 2<br><span style="font-size: 9.5pt; font-weight: normal;">la convenția nr. ${data.conventionNumber}</span></div>

    <div class="text-center" style="margin-bottom: 16px;">
      <div class="title-main">TABEL NOMINAL</div>
      <p style="margin: 4px 0;">
        Cuprinzând studenții anului <strong>${data.studyYear}</strong>, an universitar 2026-2027, specializarea <strong>${data.specialization}</strong>, Facultatea de Inginerie, care vor efectua stagiul de practică la partenerul de practică <strong>${data.companyName}</strong>
      </p>
    </div>

    <table class="table-custom">
      <thead>
        <tr>
          <th style="width: 8%;">Nr. crt.</th>
          <th style="width: 32%;">Nume și prenume student</th>
          <th style="width: 15%;">Grupa</th>
          <th style="width: 20%;">Semnătură student</th>
          <th style="width: 25%;">Cadru didactic coordonator & Semnătură</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="text-center">1</td>
          <td><strong>${data.studentName}</strong></td>
          <td class="text-center">${data.group}</td>
          <td></td>
          <td>${data.supervisorName}</td>
        </tr>
      </tbody>
    </table>

    <div class="signatures-block" style="margin-top: 40px;">
      <div class="signature-side">
        <strong>Organizator de practică</strong><br>
        ${data.facultyName}<br>
        Decan,<br>
        <strong>${data.decanName}</strong>
        <div class="signature-line">Semnătură și Ștampilă</div>
      </div>
      <div class="signature-side text-right">
        <strong>Partener de practică</strong><br>
        ${data.companyName}<br>
        Director / Reprezentant Legal,<br>
        <strong>${data.legalRepresentative}</strong>
        <div class="signature-line">Semnătură și Ștampilă</div>
      </div>
    </div>
  </div>

</body>
</html>
`;
}
