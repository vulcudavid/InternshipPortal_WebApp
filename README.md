# P14 - Portal de Practică: Matching Studenți - Firme

Platformă universitară dedicată gestionării stagiilor de practică: publicare oferte de către companii, înregistrare profiluri studenți cu CV și competențe, matching stabil cu capacități limitate bazat pe algoritmul **Gale-Shapley**, gestionarea excepțiilor prin realocare minimală, programare interviuri, generare convenție de practică în format PDF și jurnal săptămânal de pontaj ore validat de tutore.

---

## 🚀 Stivă Tehnologică

Conform deciziei de arhitectură documentate în [DECISIONS.md](docs/agents/DECISIONS.md) (**ADR-001** - status `approved`):

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/) cu **React 19** și **TypeScript**
- **Bază de date**: **PostgreSQL 16** (containerizată cu Docker Compose)
- **ORM & Migrations**: [Prisma ORM](https://www.prisma.io/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Lucide Icons](https://lucide.dev/)
- **Infrastructură locală**: [Docker Compose](https://docs.docker.com/compose/)
- **Deploy Producție**: [Railway](https://railway.app/) (Next.js Node.js runtime + PostgreSQL + Railway Volume)

---

## 🗄️ Schema Bazei de Date (11 Tabele Relaționale)

Definită în [prisma/schema.prisma](prisma/schema.prisma) și detaliată în [CONTRACTS.md](docs/agents/CONTRACTS.md):

1. **`User` (`users`)**: Autentificare, verificare obligatorie email studenți (`@ulbsibiu.ro`) prin cod OTP din 6 cifre și roluri (`STUDENT`, `COMPANY_TUTOR`, `COORDINATOR`, `ADMIN`).
2. **`StudentProfile` (`student_profiles`)**: Date academice (facultate, an, grupă), CV URL, competențe, disponibilitate.
3. **`CompanyProfile` (`company_profiles`)**: Informații companie, CUI/CIF, descriere, persoană de contact.
4. **`InternshipOffer` (`internship_offers`)**: Oferte de practică cu număr total de locuri, competențe cerute, perioadă și tutore.
5. **`StudentPreference` (`student_preferences`)**: Liste ordonate de preferințe ale studenților pentru oferte (rank 1, 2, ...).
6. **`CompanyApplicantRank` (`company_applicant_ranks`)**: Evaluarea și ordonarea candidaților de către companie.
7. **`Placement` (`placements`)**: Rezultatul stabil al algoritmului de matching (maxim 1 loc per student).
8. **`InternshipConvention` (`internship_conventions`)**: Convenții generate automat în format PDF cu date precompletate și flux de semnare.
9. **`WorkLog` (`work_logs`)**: Jurnal / pontaj săptămânal al orelor de practică, validat de tutorele din companie.
10. **`InterviewSlot` (`interview_slots`)**: Sloturi orare propuse de firmă și rezervate de studenți pentru interviuri.
11. **`FinalEvaluation` (`final_evaluations`)**: Fișă de evaluare finală completată de tutore la încheierea stagiului.

---

## 📄 Verificare Vizuală — Convenția de Practică (PDF)

Generatorul nativ Node.js bazat pe `pdfkit` produce documentul oficial al Convenției-cadru ULBS (3 pagini, format A4, suport complet diacritice UTF-8 cu fonturi Roboto). Toate câmpurile sunt conforme cu formularul universitar: datele studentului, companiei partenere, tutorelui din firmă, cadrului didactic supervizor, calendarul/orarul de lucru, numărul de credite ECTS (4 credite / 90 ore), precum și **Anexa 1** (Portofoliu de practică cu definirea competențelor și comisia de evaluare) și **Anexa 2** (Tabel nominal cu studenții repartizați).

<div align="center">
  <img src="docs/images/conventie-pdf-preview.png" alt="Previzualizare Convenție de Practică ULBS PDF" width="700" style="border: 1px solid #cbd5e1; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);" />
  <p><em>Figura 1: Previzualizarea primei pagini a Convenției Oficiale de Practică ULBS generată dinamic de platformă</em></p>
</div>

---

## 📋 Cerințe Preliminare

Asigurați-vă că aveți instalate pe sistem:
- **Node.js** >= 20.x (recomandat v22+)
- **npm** >= 10.x
- **Docker** și **Docker Compose**

---

## 🛠️ Instrucțiuni de Pornire Locală (cu Docker Compose)

### 1. Clonare și configurare variabile de mediu

Copiați fișierul de configurare șablon:

```bash
cp .env.example .env
```

Parametrii impliciți sunt deja preconfigurați pentru dezvoltare locală:
- `DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/web2_lab?schema=public"`
- `NEXT_PUBLIC_APP_URL="http://localhost:3000"`
- `NEXT_PUBLIC_ENABLE_DEMO_LOGIN="true"`
- `STORAGE_PATH="./storage"`
- `ADMIN_SEED_PASSWORD="AdminULBS2026!"`
- `COORDINATOR_SEED_PASSWORD="CoordULBS2026!"`
- `SMTP_HOST=""`, `SMTP_PORT="587"`, `SMTP_USER=""`, `SMTP_PASS=""`, `SMTP_FROM=""` *(opțional în mediul local — codurile OTP de verificare sunt afișate direct în consolă ca fallback)*

### 2. Pornirea bazei de date în Docker

Lansați containerul PostgreSQL în fundal:

```bash
docker compose up -d
# sau folosind scriptul npm:
# npm run db:up
```

Verificați că serviciul este pornit și sănătos:

```bash
docker compose ps
# sau: npm run db:status
```

### 3. Instalarea dependențelor

Instalați pachetele Node.js:

```bash
npm install
```

*(Comanda va rula automat și `prisma generate` pentru generarea clientului TypeScript Prisma).*

### 4. Sincronizarea schemei în baza de date

Aplicați schema Prisma direct pe baza de date din Docker:

```bash
npx prisma db push
# sau folosind scriptul npm:
# npm run db:push
```

### 5. Popularea bazei de date (Seeding)

Inițializați conturile de sistem universitare (Administrator, Coordonator) și datele demo de test:

```bash
npm run db:seed
```

> **Conturi create implicit pentru testare:**
> - **Administrator**: `admin@universitate.ro` (Parolă: `AdminULBS2026!`)
> - **Coordonator**: `coordonator@universitate.ro` (Parolă: `CoordULBS2026!`)
> - **Companii demo**: Continental, Bitdefender, Marquardt
> - **Studenți demo**: Popescu Ion, Ionescu Maria, Radu Andrei, Dumitrescu Elena, Stan Cristian

### 6. Pornirea serverului de dezvoltare

Lansați aplicația Next.js:

```bash
npm run dev
```

Aplicația va fi accesibilă în browser la: **[http://localhost:3000](http://localhost:3000)**

---

## ☁️ Ghid de Configurare și Deploy pe Railway

Platforma poate fi publicată facil pe [Railway](https://railway.app/) urmând pașii:

### 1. Creare Proiect și Bază de Date PostgreSQL
1. Accesați dashboard-ul Railway și creați un proiect nou (**New Project**).
2. Adăugați serviciul **PostgreSQL** (*Database -> Add PostgreSQL*).
3. Railway va aloca automat o variabilă de mediu `${{Postgres.DATABASE_URL}}`.

### 2. Adăugare Serviciu Web (Aplicația Next.js)
1. Conectați repository-ul GitHub sau creați un serviciu gol și trimiteți codul prin Railway CLI.
2. Railway va detecta automat proiectul Next.js și va folosi `npm run build` urmat de `npm run start`.

### 3. Atașare Persistent Volume (Stocare Fișiere)
Convențiile PDF generate și CV-urile încărcate necesită persistență între redeploy-uri:
1. În setările serviciului web, navigați la secțiunea **Volumes**.
2. Adăugați un volum persistent nou:
   - **Mount Path**: `/storage`
3. În secțiunea **Variables**, setați variabila:
   ```env
   STORAGE_PATH="/storage"
   ```

### 4. Configurare Variabile de Mediu pe Railway
În fila **Variables** a serviciului web Next.js, adăugați următoarele chei:

| Variabilă | Valoare Recomandată / Notă |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (referință dinamică la serviciul Postgres) |
| `NEXT_PUBLIC_APP_URL` | `https://${{RAILWAY_PUBLIC_DOMAIN}}` (sau domeniul dvs. personalizat) |
| `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` | `"false"` (*obligatoriu în producție pentru a dezactiva accesul rapid demo*) |
| `STORAGE_PATH` | `"/storage"` (directorul unde este montat volumul Railway) |
| `ADMIN_SEED_PASSWORD` | O parolă complexă dedicată contului de administrator în producție |
| `COORDINATOR_SEED_PASSWORD` | O parolă complexă dedicată contului de coordonator în producție |
| `SMTP_HOST` | Host-ul serverului SMTP (ex: `smtp.sendgrid.net`, `smtp.mailgun.org` sau server universitar) |
| `SMTP_PORT` | Portul SMTP (ex: `587` TLS sau `465` SSL) |
| `SMTP_USER` | Utilizatorul de autentificare SMTP |
| `SMTP_PASS` | Parola sau API Key-ul pentru SMTP |
| `SMTP_FROM` | Adresa expeditorului (ex: `"Portal Practica ULBS" <no-reply@ulbsibiu.ro>`) |
| `COORDINATOR_SEED_PASSWORD` | O parolă complexă dedicată contului de coordonator în producție |

### 5. Inițializarea Bazei de Date în Producție
După primul deployment reușit:
1. Deschideți terminalul serviciului din Railway Dashboard (*Deployments -> View Logs / Exec Terminal*) sau rulați local prin Railway CLI:
   ```bash
   railway run npx prisma db push
   railway run npm run db:seed
   ```
2. Deoarece `NEXT_PUBLIC_ENABLE_DEMO_LOGIN="false"`, comanda `db:seed` va genera exclusiv conturile administrative securizate (`admin@universitate.ro` și `coordonator@universitate.ro`), fără înregistrări fictive de test.

---

## 🔍 Prisma Studio (Interfață vizuală pentru Baza de Date)

Pentru a vizualiza și gestiona înregistrările din baza de date în dezvoltare locală:

```bash
npm run db:studio
```

Aceasta va deschide Prisma Studio la adresa `http://localhost:5555`.

---

## 📦 Scripturi NPM Disponibile

| Script | Descriere |
|---|---|
| `npm run dev` | Pornește serverul Next.js în mod dezvoltare (port 3000) |
| `npm run build` | Compilează aplicația pentru producție |
| `npm run start` | Pornește serverul compilat în producție |
| `npm run lint` | Validează codul sursă cu ESLint |
| `npm run test` | Rulează suita de teste automate cu Vitest |
| `npm run db:up` | Pornește containerul PostgreSQL în fundal prin Docker Compose |
| `npm run db:down` | Oprește containerul PostgreSQL |
| `npm run db:status` | Afișează starea containerelor Docker |
| `npm run db:push` | Sincronizează schema Prisma direct în baza de date PostgreSQL |
| `npm run db:seed` | Populează baza de date cu date inițiale / demo |
| `npm run db:migrate` | Creează și aplică o migrație Prisma nouă |
| `npm run db:generate` | Generează clientul TypeScript `@prisma/client` |
| `npm run db:studio` | Pornește interfața grafică Prisma Studio pe portul 5555 |

---

## 📁 Structura Proiectului

```text
InternshipPortal_WebApp/
├── AGENTS.md                  # Regulile de lucru pentru agenți AI
├── docker-compose.yml         # Serviciul PostgreSQL pentru mediul de dezvoltare
├── docs/
│   ├── brief.md               # Cerințele oficiale de proiect (P14)
│   └── agents/
│       ├── CONTRACTS.md       # Modele de date, entități și diagrame ERD
│       ├── DECISIONS.md       # Registru ADR (ADR-001 Stivă aprobată)
│       ├── OPEN-QUESTIONS.md  # Întrebări deschise și clarificări viitoare
│       └── PATTERNS.md        # Șabloane de cod și bune practici
├── prisma/
│   ├── schema.prisma          # Schema completă a bazei de date (11 tabele)
│   └── seed.ts                # Script de populare (conturi universitare + opțional demo)
├── src/
│   ├── app/
│   │   ├── actions/           # Server Actions (auth, student, company, coordinator, gdpr, convention)
│   │   ├── admin/             # Panoul de administrare universitar și conformitate GDPR
│   │   ├── api/               # Rute API protejate (conventions/download, cv/download, gdpr/anonymize)
│   │   ├── globals.css        # Stiluri Tailwind CSS
│   │   ├── layout.tsx         # Root layout Next.js
│   │   ├── not-found.tsx      # Pagină de eroare 404 personalizată
│   │   └── page.tsx           # Pagină principală și dashboard-uri dinamice pe roluri
│   ├── components/            # Componente React organizate pe roluri
│   │   ├── admin/             # Tab-uri administrare, audit log, setări, utilizatori GDPR
│   │   ├── company/           # Gestionare oferte, interviuri, ierarhizare candidați
│   │   ├── coordinator/       # Panou coordonator, execuție algoritm Gale-Shapley, export CSV
│   │   └── student/           # Gestionare profil, încărcare CV, selecție preferințe, convenție
│   ├── lib/                   # Module de logică de business și utilitare
│   │   ├── conventions/       # Generare și șablonare convenții de practică PDF
│   │   ├── matching.ts        # Implementare algoritm Gale-Shapley cu cote de capacitate
│   │   ├── gdpr.ts            # Mecanism anonimizare și descărcare date conform GDPR Art. 17
│   │   ├── storage.ts         # Manager stocare fișiere pe disc / volum persistent
│   │   ├── auth.ts            # Sesiune utilizator securizată pe cookies HTTP-only
│   │   └── prisma.ts          # Singleton Prisma Client pentru Next.js
│   └── middleware.ts          # Middleware securitate și rutare protejată
├── storage/                   # Director local pentru stocare fișiere (CV-uri, PDF-uri)
├── .env                       # Variabile de mediu locale
├── .env.example               # Șablon variabile de mediu (local & Railway)
├── package.json               # Dependențe și scripturi npm
├── tsconfig.json              # Configurare compilator TypeScript
└── README.md                  # Documentație completă a proiectului
```
