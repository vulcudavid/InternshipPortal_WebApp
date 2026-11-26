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


## ADR-006: Arhitectura de Generare și Management al Convențiilor de Practică PDF (Șablon Oficial ULBS Licență 2026-2027)

- **Data**: 2026-11-19
- **Status**: accepted
- **Autor**: Agent AI & David Vulcu

### 1. Context și Cerințe
Proiectul P14 impune generarea convențiilor de practică ca documente oficiale precompletate, conform șablonului real al Facultății de Inginerie ULBS (`Template_Conventie-pentru-efectuarea-stagiului-de-practica-Licenta_2026-2027.docx`).
Cerințe cheie:
- Generarea este disponibilă exclusiv pentru plasamentele cu status `CONFIRMED`.
- Documentul trebuie să reflecte fidel structura formularului universitar:
  - Date părți (Facultatea de Inginerie ULBS, decan prof.univ.dr.ing. Maria Vințan; Partener de practică cu CUI/CIF, adresă, reprezentant, tutore).
  - Art. 1 - 12 din convenția-cadru.
  - Anexa 1 (Portofoliu practică: date student, durată 90 ore / 3 săptămâni, tabel competențe vizate).
  - Anexa 2 (Tabel nominal practicant, grupă, specializare).
- Suport impecabil pentru diacriticele limbii române (ă, â, î, ș, ț) în codare UTF-8.
- Flux de semnare flexibil: descărcare PDF generat, posibilitate de încărcare scan semnat (PDF/imagine) și/sau marcare ca semnată de către student (`SIGNED_BY_STUDENT`) și coordonator (`APPROVED_BY_COORDINATOR`).
- Sincronizare automată cu indicatorul „Convenții Lipsă” din Dashboard-ul Coordonatorului Academic.

### 2. Decizia de Arhitectură
1. **Generare Document Server-Side**:
   - Modul dedicat `src/lib/conventions/generator.ts` ce compilează datele complete (`prefilledData` JSON) din relațiile `Placement` $\rightarrow$ `StudentProfile` / `User` $\rightarrow$ `InternshipOffer` $\rightarrow$ `CompanyProfile`.
   - Generare șablon HTML print-ready A4 (`@page { size: A4; margin: 15mm; }`) cu tipografie conformă `DESIGN.md` și conversie automată în PDF nativ prin utilitarul de sistem LibreOffice headless (`soffice --headless --convert-to pdf`), stocat în `storage/conventions/`.
   - Endpoint dedicat de preview și descărcare `/api/conventions/[id]/download` cu autorizare per rol.
2. **Stocare Securizată**:
   - Fișierele generate și scanurile semnate se salvează în `storage/conventions/` (director privat, ferit de acces direct web).
3. **Flux de Semnare & Server Actions**:
   - `generateConventionAction(placementId)`: accesibil coordonatorului sau generat automat la confirmare.
   - `uploadSignedConventionAction(conventionId, formData)`: permite studentului sau coordonatorului încărcarea scanului semnat (PDF, PNG, JPG).
   - `signConventionAction(conventionId, role)`: permite marcarea digitală ca semnată (`SIGNED_BY_STUDENT` / `APPROVED_BY_COORDINATOR`).
4. **Impact Metrici Coordonator**:
   - KPI-ul „Convenții lipsă” reflectă toate plasamentele `CONFIRMED` fără înregistrare de convenție sau cu status nesemnat (`DRAFT`, `GENERATED`).


## ADR-007: Securizarea CV-urilor și Implementarea Dreptului la Ștergere / Anonimizare Conform GDPR (Art. 17)

- **Data**: 2026-11-19
- **Status**: accepted
- **Autor**: Agent AI & David Vulcu

### 1. Context și Cerințe GDPR
Confidențialitatea datelor studenților (GDPR) impune reguli riguroase:
- **Protecția fișierelor CV**: CV-urile încărcate conțin date cu caracter personal (telefon, adresă, email, istoric educațional). Stocarea lor în `public/uploads/` permitea descărcarea directă prin URL static, ocolind verificările Privacy Gate.
- **Autorizare Strictă la Descărcare**: Accesul la CV trebuie permis doar titularului student, coordonatorului academic și firmelor la ale căror oferte studentul a aplicat explicit. Orice alt acces din partea unei firme terțe trebuie respins cu `403 Forbidden` (iar neautentificat cu `401 Unauthorized`).
- **Consimțământ Explicit GDPR**: Formularul de profil/înregistrare student trebuie să conțină o bifă obligatorie de acceptare a prelucrării datelor personale pentru scopul stagiilor de practică.
- **Dreptul la Ștergere (Right to Erasure - Art. 17 GDPR)**: Posibilitatea ca un student să solicite ștergerea sau anonimizarea ireversibilă a datelor sale personale din sistem.

### 2. Decizia de Arhitectură
1. **Mutarea Stocării CV-urilor în Director Privat**:
   - Toate CV-urile sunt stocate în directorul privat `storage/cvs/` (în afara directorului `public/`).
   - Servirea fișierului se face exclusiv prin API Route-ul securizat `GET /api/cv/[studentId]`.
2. **Autorizare Granulară și Teste Automate**:
   - Endpoint-ul `/api/cv/[studentId]` validează autorizarea conform matricei:
     - `STUDENT`: permis dacă `currentUser.studentProfile.id === studentId`, altfel 403.
     - `COORDINATOR` / `ADMIN`: permis (audit și supraveghere academică).
     - `COMPANY_TUTOR`: permis **doar dacă** studentul are cel puțin o preferință (`StudentPreference`) pentru o ofertă a acelei companii, altfel 403 Forbidden.
     - Neautentificat: 401 Unauthorized.
   - Suită automată de teste de autorizare (`test:cv-auth`).
3. **Modelare Consimțământ în Schema Prisma**:
   - Adăugare câmpuri `gdprConsent Boolean @default(false)` și `gdprConsentAt DateTime?` în modelul `StudentProfile`.
4. **Anonimizare și Ștergere Ireversibilă (`anonymizeStudentProfile`)**:
   - Ștergerea fișierului CV fizic de pe disc (`fs.unlink`).
   - Anonimizarea datelor de identificare din `User` (`firstName: "Student"`, `lastName: "[Anonimizat]"`, `email: "gdpr-erased-<uuid>@anonymized.ulbsibiu.ro"`, `isActive: false`).
   - Golirea metadatelor private din `StudentProfile` (`headline: null`, `bio: null`, `phone: null`, `cvUrl: null`, link-uri sociale: null).
   - Conservarea structurii anonimizate a plasamentului (`Placement`) pentru a nu periclita integritatea istorică și rapoartele universitare de audit ale algoritmului Gale-Shapley.
   - Suită automată de teste pentru verificarea procesului de anonimizare (`test:gdpr`).


## ADR-008: Securizare RBAC, Prevenire IDOR și Protecție de Producție pentru Demo Login

- **Data**: 2026-11-25
- **Status**: accepted
- **Autor**: Agent AI & David Vulcu

### 1. Context și Cerințe
În vederea pregătirii lansării în producție pe platforma Railway, a fost efectuat un audit complet de securitate și autorizare asupra tuturor rutelor API (`src/app/api/**`) și Server Actions (`src/app/actions/**`):
- **Prevenire IDOR (Insecure Direct Object Reference)**: Oricare utilizator autentificat ar fi putut teoretic trimite ID-uri arbitrare în parametri pentru a accesa convenții străine, modifica preferințe, pontaje sau evaluări ale altor entități.
- **Protecție Demo Login în Producție**: Flag-ul `NEXT_PUBLIC_ENABLE_DEMO_LOGIN="false"` trebuie să prevină complet autentificarea 1-click atât la nivel de UI (butoanele ascunse) cât și pe server (`403 Forbidden` la orice apel direct al rutei `/api/auth/demo` sau funcției `switchDemoUserAction`).

### 2. Decizia de Arhitectură
1. **Verificare Strictă a Proprietății (Ownership Checks) în Server Actions și API**:
   - `src/app/actions/convention.ts`: `getConventionDetails`, `markConventionSignedByStudent`, `uploadSignedConventionScan`, `generateConventionForPlacement` verifică explicit rolul și apartenența:
     - `STUDENT`: permis doar dacă plasamentul asociat convenției îi aparține (`placement.studentId === currentUser.studentProfile.id`).
     - `COMPANY_TUTOR`: permis doar dacă oferta asociată plasamentului aparține companiei sale (`placement.offer.companyId === currentUser.companyProfile.id`).
     - `COORDINATOR` / `ADMIN`: acces global pentru supraveghere academică și audit.
   - `src/app/actions/student.ts`: `removeStudentPreference` validează că preferința ștearsă aparține strict profilului studentului autentificat.
   - `src/app/actions/work-log.ts` & `src/app/actions/evaluation.ts`: validare ownership student la creare/editare pontaj și tutore la aprobare sau notare.
2. **Guvernare Demo Login pe Server**:
   - Helper centralizat `isDemoLoginEnabled()` în `src/lib/auth.ts` ce verifică valoarea booleană a `NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true"`.
   - Endpoint dedicat `POST /api/auth/demo` returnează `403 Forbidden` (`{ error: "Demo login is disabled in production" }`) dacă flag-ul este dezactivat.
   - În `loginUser` și `switchDemoUserAction`, orice tentativă de login cu credențiale sau rol demo este respinsă automat dacă flag-ul nu este activ.
3. **Validare Automată prin Teste**:
   - Suită dedicată de teste de securitate `src/lib/security-rbac.test.ts` ce verifică blocarea tentativelor IDOR pe convenții și preferințe, precum și respingerea demo login-ului când flag-ul este inactiv.


## ADR-009: Verificare Obligatorie a Adreselor de Email Studențești prin Cod OTP din 6 Cifre (@ulbsibiu.ro)

- **Data**: 2026-11-25
- **Status**: accepted
- **Autor**: Agent AI & David Vulcu

### 1. Context și Cerințe
Pentru a asigura autenticitatea identității studenților din cadrul Universității „Lucian Blaga” din Sibiu și a preveni crearea de conturi fictive:
- Doar adresele instituționale `@ulbsibiu.ro` pot înregistra conturi de student.
- Înregistrarea trebuie condiționată de verificarea unui cod numeric de unică folosință (OTP) din 6 cifre trimis pe email.
- Utilizatorii creați manual de Administrator sau prin seed trebuie să fie activi și verificați implicit (`emailVerified: true`).

### 2. Decizia de Arhitectură
1. **Extindere Schemă Bază de Date (`prisma/schema.prisma`)**:
   - Pe modelul `User` au fost adăugate câmpurile:
     - `emailVerified Boolean @default(false) @map("email_verified")`
     - `verificationCodeHash String? @map("verification_code_hash")`
     - `verificationCodeExpiresAt DateTime? @map("verification_code_expires_at")`
   - Migrare dedicată: `20261125204019_add_email_verification`.
2. **Serviciu de Trimitere Email (`src/lib/mailer.ts`)**:
   - Integrare bibliotecă standard `nodemailer` cu suport pentru variabilele de mediu `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
   - În medii locale sau de test unde `SMTP_HOST` nu este setat, se aplică automat mecanismul de fallback: logarea codului în consolă (`[MAILER FALLBACK] Code for <email>: <code>`) fără blocarea fluxului sau eroare fatală.
3. **Fluxul Criptografic și de Expirare al Codului OTP**:
   - La `registerStudent`: generare cod aleatoriu numeric (`crypto.randomInt(100000, 1000000)`), hash-uire securizată cu `bcryptjs` (salt rounds 10), expirare la **15 minute**.
   - Nu se emite cookie de sesiune la înregistrare; clientul primește `{ requiresVerification: true, email }`.
   - `verifyEmailCode(email, code)`: compară codul primit cu hash-ul stocat, verifică termenul de expirare, setează `emailVerified: true`, șterge hash-ul și data de expirare, creează sesiunea de autentificare.
   - `resendVerificationCode(email)`: impune o politică de rate-limiting (cooldown strict de **60 de secunde**) între solicitările de retrimitere (`COOLDOWN_ACTIVE`).
4. **Protecție la Autentificare (`loginUser`)**:
   - Dacă `user.emailVerified === false`, autentificarea este refuzată cu codul de eroare `EMAIL_NOT_VERIFIED`, ghidând utilizatorul către formularul de introducere a codului OTP.
5. **Gestionare Utilizatori Seed și Admin**:
   - `prisma/seed.ts` setează `emailVerified: true` pentru toți utilizatorii predefiniți.
   - Server action-ul de creare utilizatori de către admin (`adminCreateUser` în `src/app/actions/admin.ts`) creează conturi cu `emailVerified: true`.
6. **Validare Automată prin Teste**:
   - Suită completă de teste unitare în `src/lib/email-verification.test.ts` (7 scenarii: înregistrare student cu cod hash-uit, blocare login fără verificare, verificare cu cod valid/greșit/expirat, retrimitere cod și respectare cooldown de 60 secunde).

