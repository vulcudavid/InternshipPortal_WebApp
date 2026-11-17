# Registrul de Decizii de Arhitectură (ADR)

## ADR-001: Alegerea stivei tehnologice pentru Portalul de Practică (P14)

- **Data**: 2026-11-06
- **Status**: approved
- **Autor**: Agent AI & David Vulcu

### 1. Context și Cerințe
Proiectul **P14 (Portal de practică: matching studenți-firme)** reprezintă o platformă universitară complexă ce necesită:
- Gestionarea a 4 roluri de utilizatori: Studenți, Tutori Firmă, Coordonatori Practică (Facultate), Administratori.
- Algoritm avansat de alocare stabilă bazat pe **Gale-Shapley** (respectare capacități, liste ordonate de preferințe bilaterale) și suport pentru **realocare minimală** la excepții umane (refuz student, retragere ofertă).
- Programare sloturi interviuri și notificări.
- Generare și gestiune convenții de practică în format PDF (date precompletate, flux de semnare/upload scan).
- Jurnal de pontaj săptămânal (ore lucrate, validare tutore) și fișă de evaluare finală.
- Dashboard-uri administrative cu statistici în timp real și exporturi.

### 2. Opțiuni Luate în Considerare

1. **Next.js (App Router, TypeScript) + PostgreSQL + Prisma ORM + Tailwind CSS**
   - *Avantaje*:
     - **Full-stack TypeScript**: Type-safety end-to-end între baza de date (Prisma), logica de backend (Server Actions / Route Handlers) și interfața utilizator (React Server Components).
     - **Arhitectură unificată**: Un singur repo și proces de build, eliminând discrepanțele dintre frontend și API separat.
     - **Execuție server-side sigură**: Algoritmul de matching Gale-Shapley și generarea PDF rulează nativ pe server în TypeScript, beneficiind de tranzacții ACID cu PostgreSQL.
     - **UI rapid și modern**: Tailwind CSS cu suport modular pentru componente accesibile și responsive.
   - *Dezavantaje*: Curba de învățare pentru React Server Components (gestionată facil prin structurarea clară a componentelor).

2. **Node.js / Express (REST API) + React (Vite SPA) + PostgreSQL + Prisma ORM**
   - *Avantaje*: Separare clasică client-server.
   - *Dezavantaje*: Overhead suplimentar de mentenanță (două proiecte separate, configurare CORS, dublarea tipurilor de date între client și server, deployment mai complex).

3. **Python (FastAPI / Django) + PostgreSQL + React SPA**
   - *Avantaje*: Librării matematice avansate.
   - *Dezavantaje*: Fragmentarea limbajelor în echipă (Python pe backend, TypeScript pe frontend), complexitate adițională de integrare.

### 3. Decizia Adoptată

Am decis adoptarea stivei:
- **Framework Full-stack**: **Next.js 15 (App Router)** cu **TypeScript**
- **Bază de date**: **PostgreSQL 16** (containerizată prin **Docker Compose**)
- **ORM & Migrations**: **Prisma ORM**
- **Styling UI**: **Tailwind CSS** cu iconuri **Lucide React**
- **Containerizare dev**: **Docker & Docker Compose**

### 4. Consecințe și Beneficii
- **Integritate relațională**: PostgreSQL + Prisma garantează chei externe, constrângeri unice și tranzacții atomice la matching și generare de convenții.
- **Productivitate ridicată**: Generarea automată a clientului Prisma `@prisma/client` oferă autocompletion și verificări la compilare pentru toate cele 10+ tabele relaționate.
- **Start rapid**: Dezvoltatorul poate porni întreaga infrastructură cu o singură comandă `docker compose up -d` urmată de `npm run dev`.
- **Evolutivitate**: Next.js App Router permite extinderea facilă cu API-uri REST/JSON pentru eventuale integrări mobile sau externe (secretariate, sisteme universitare).


## ADR-002: Arhitectura „Professional Matching / Social Platform”, Scor de Compatibilitate și Politică de Confidențialitate CV

- **Data**: 2026-11-06
- **Status**: approved
- **Autor**: Agent AI & David Vulcu

### 1. Context și Cerințe Extinse
Pentru proiectul P14, interacțiunea dintre studenți și companii este concepută ca o platformă profesională de matching:
- **Profil student**: Secțiune bio detaliată, linkuri profesionale (GitHub, LinkedIn, portofoliu) și competențe exprimate prin tag-uri predefinite structurate pe domeniile Facultății de Inginerie (Calculatoare & Tehnologia Informației, Electronică & Telecomunicații, Mecatronică & Robotică, Inginerie Industrială / Management), plus posibilitatea adăugării de tag-uri personalizate (custom tags).
- **Poziții de practică (firme)**: Publicate cu seturi de tag-uri obligatorii și opționale, descriere proiect și tutore desemnat.
- **Motor de recomandare**: Calcularea unui scor de compatibilitate $S \in [0, 100]\%$ bazat pe gradul de suprapunere ponderată a competențelor și domeniilor.
- **Matching final**: Algoritmul Gale-Shapley (varianta Many-to-One / Hospital-Residents) aplicat pe baza preferințelor reale exprimate/validate de ambele părți (clasamente informate de scorul de recomandare).
- **Politica de confidențialitate (Privacy Gate)**: Datele de contact și fișierul CV detaliat sunt accesibile firmei **doar dacă studentul a aplicat explicit** la oferta respectivă. Până la aplicare, firma poate vedea doar profilul anonimizat/rezumat (competențe, an de studiu, scor compatibilitate, fără date personale de contact sau CV).

### 2. Decizia de Arhitectură
1. **Modelare Tag-uri & Taxonomie**:
   - Model dedicat `Tag` cu categorie (`EngineeringDomain`), flag `isPredefined` și relații Many-to-Many către `StudentProfile` (`StudentTag`) și `InternshipOffer` (`OfferTag`).
   - `OfferTag` include un nivel de importanță (`isRequired: Boolean`, pondere `weight`).
2. **Motorul de Scoring**:
   - Funcție pură și deterministă `calculateCompatibilityScore(studentTags, offerTags)`:
     - Calculează acoperirea tag-urilor obligatorii și opționale.
     - Ponderare pe domenii comune din cadrul Facultății de Inginerie.
     - Returnează procentaj și explicație detaliată a punctajului (competențe potrivite vs lipsă).
3. **Restricția de Acces la CV (Privacy Gate)**:
   - Verificare la nivel de Server Action / API Route / Data Access Layer:
     - Accesul la `cvUrl` este permis exclusiv dacă există o înregistrare în `CompanyApplicantRank` / `Application` cu status activ asociată studentului și ofertei deținute de firmă.


## ADR-003: Constrângerea de Unicitate pe Clasamentul Firmei (CompanyApplicantRank) și Pattern-ul Tranzacțional cu Ranguri Negative Temporare

- **Data**: 2026-11-17
- **Status**: approved
- **Autor**: Agent AI & David Vulcu

### 1. Context și Cerințe
Algoritmul de matching Gale-Shapley (Many-to-One) necesită din partea fiecărei companii o listă strict ordonată a preferințelor pentru candidații săi (Locul 1, Locul 2, ...).
Pentru a asigura integritatea datelor în PostgreSQL:
- Fiecare aplicant ierarhizat pentru o ofertă trebuie să aibă un rang unic pozitiv (1..N).
- Schema Prisma a fost actualizată cu `@@unique([offerId, rank])` pe modelul `CompanyApplicantRank`.

### 2. Problema Tehnică a Reordonării
La actualizarea ordinii elementelor într-un tabel cu constrângere de unicitate (ex: mutarea elementului de pe rangul 2 pe rangul 1), modificarea directă produce o eroare `UniqueConstraintViolation` dacă rangul țintă este deja ocupat de o altă înregistrare înainte ca aceasta să fie actualizată.

### 3. Decizia Adoptată: Pattern Tranzacțional în 2 Pași cu Ranguri Negative Temporare
Pentru orice reordonare a candidaților (`reorderCompanyApplicantRanks`) sau a preferințelor studenților (`reorderStudentPreferences`), operațiunea este executată într-o tranzacție atomică `prisma.$transaction`:
1. **Pasul 1 (Ranguri negative)**: Toate înregistrările afectate primesc temporar ranguri negative: `rank = -(i + 1)`. Astfel, se eliberează toate rangurile pozitive fără a genera coliziuni.
2. **Pasul 2 (Ranguri finale pozitive)**: Fiecare înregistrare primește rangul final calculat: `rank = i + 1`.

### 4. Consecințe
- Garanție matematică de atomicitate ACID fără coliziuni de constrângere unică.
- Interfața utilizator poate efectua operațiuni de Drag & Drop sau mutări Sus/Jos fără riscul de corupere a clasamentului.


## ADR-004: Politica GDPR Privacy Gate - Exclusivitate pe Baza Preferinței Studentului și Integrarea Nativă a Skill-urilor de Lucru

- **Data**: 2026-11-17
- **Status**: approved
- **Autor**: Agent AI & David Vulcu

### 1. Context și Regula GDPR Privacy Gate
În proiectul universitar P14, protecția datelor cu caracter personal (GDPR) impune ca datele de contact directe (telefon) și fișierul CV (PDF) ale studentului să nu fie accesibile public companiilor.
- **Clarificare Regulă**: O firmă poate vizualiza și descărca CV-ul unui student **EXCLUSIV DACĂ** studentul a adăugat în mod voluntar o ofertă a acelei companii în lista sa de preferințe (`StudentPreference`).
- Dacă o companie ierarhizează unilateral un student dintr-un feed general de recomandări (fără ca studentul să fi aplicat la acea firmă), CV-ul și datele de contact **rămân strict blocate și anonimizate**.

### 2. Decizia de Implementare Privacy Gate
1. `canCompanyAccessStudentCv(companyProfileId, studentId, targetOfferId?)` verifică exclusiv existența unei intrări în `StudentPreference` legate de compania respectivă.
2. Endpoint-ul securizat `GET /api/cv/[studentId]` returnează HTTP 403 Forbidden dacă această condiție nu este satisfăcută.
3. Funcția `sanitizeStudentProfileForCompany` maschează `cvUrl: null` și `phone: null` pentru studenții din feed-ul de talente recomandate care nu au aplicat încă.

### 3. Integrarea Nativă a Skill-urilor de Guvernanță (`/plan`, `/build`)
Pentru a formaliza fluxul de lucru în Antigravity/Gemini pe baza regulilor din `AGENTS.md`:
1. `.agents/skills/plan/SKILL.md`: Guvernează faza de cercetare și planificare fără modificări în cod până la aprobarea explicită.
2. `.agents/skills/build/SKILL.md`: Guvernează implementarea tehnică, testarea automată obligatorie, actualizarea registrului și interdicția strictă de `git push` fără acordul utilizatorului.

## D-005: Politica Stărilor Plasamentelor și Acțiunea `cancelPlacementByCompany`

- **Data**: 2026-11-17
- **Status**: approved
- **Autor**: Agent AI & David Vulcu

### 1. Context
Algoritmul Gale-Shapley produce plasamente (`Placement`) pentru perechi student-ofertă. Trebuie definit comportamentul la re-rulare și la excepții umane (retragere firmă, refuz student).

### 2. Decizii Aprobate

#### 2.1 Status inițial al plasamentelor: `PENDING_CONFIRMATION`
- La prima rulare a matching-ului, toate plasamentele produse de Gale-Shapley primesc statusul **`PENDING_CONFIRMATION`**.
- Coordonatorul Academic poate vizualiza lista și confirma individual sau în bulk.
- Plasamentul trece la `CONFIRMED` exclusiv prin acțiunea explicită a coordonatorului.

#### 2.2 Protecția plasamentelor `CONFIRMED` la re-rulare
- La o re-rulare a matching-ului (ex: adăugare ofertă nouă sau student nou), plasamentele cu status **`CONFIRMED` nu sunt modificate, șterse sau perturbate**.
- Re-rularea produce doar plasamente noi sau actualizări pentru perechile care nu sunt încă `CONFIRMED`.
- Garanție: un student `CONFIRMED` nu poate fi mutat de algoritm la altă ofertă.

#### 2.3 Acțiunea separată `cancelPlacementByCompany`
- Firma (tutore) poate apela acțiunea **`cancelPlacementByCompany(placementId)`** pentru a retrage un plasament `PENDING_CONFIRMATION` sau `CONFIRMED`.
- Acțiunea **nu re-rulează automat** algoritmul; ea marchează plasamentul ca `CANCELLED_BY_COMPANY` și eliberează locul.
- Coordonatorul este notificat (in-app) și decide dacă inițiază o realocare minimală manuală sau o re-rulare parțială.
- Un student al cărui plasament a fost anulat de firmă revine la statusul „neplasat" și devine eligibil pentru re-alocare.

### 3. Enum `PlacementStatus` (Prisma)
```prisma
enum PlacementStatus {
  PENDING_CONFIRMATION   // Generat de algoritm, neconfirmat încă
  CONFIRMED              // Aprobat explicit de coordonator
  CANCELLED_BY_STUDENT   // Studentul a refuzat locul
  CANCELLED_BY_COMPANY   // Firma a retras oferta/plasamentul
  CANCELLED_BY_COORDINATOR // Excepție administrativă
}
```

### 4. Consecințe
- Dashboard-ul Coordonator filtrează plasamentele pe status și permite acțiuni bulk de confirmare.
- Firma vede statusul plasamentului pentru ofertele sale, dar nu poate confirma — doar anula.
- Studentul vede statusul plasamentului său în read-only.
