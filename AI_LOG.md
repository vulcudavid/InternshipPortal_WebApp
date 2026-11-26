# AI_LOG.md — Jurnal Sesiuni AI

Înregistrează cronologic sesiunile de lucru agent-AI pe proiectul **P14 Portal de Practică ULBS**.

---

## Format Intrare

```
### S-NNN | YYYY-MM-DD | [MODEL] | Autor: [David Vulcu / Agent]
**Scop sesiune**: ...
**Realizat**:
- ...
**Decizii luate / ADR creat**: ADR-xxx
**Fișiere modificate**: ...
**Status final**: ✅ done | ⏳ în progres | ❌ blocat
```

---

## Sesiuni

### S-001 | 2026-11-06 | Gemini | Autor: Agent AI & David Vulcu
**Scop sesiune**: Setup inițial proiect agentic.
**Realizat**:
- Creare structură inițială repo: `AGENTS.md`, `docs/brief.md`, `docs/agents/DECISIONS.md`, `docs/agents/OPEN-QUESTIONS.md`, `docs/agents/PATTERNS.md`, `docs/agents/CONTRACTS.md`.
- Schema Prisma inițială (11 tabele).
- Docker Compose pentru PostgreSQL.
- Next.js 15 skeleton + Tailwind CSS + Lucide Icons.
**Decizii luate**: ADR-001 (stivă tehnologică aprobată)
**Fișiere modificate**: `AGENTS.md`, `README.md`, `prisma/schema.prisma`, `docker-compose.yml`, `package.json`, `src/app/page.tsx`, `src/app/layout.tsx`, `src/lib/prisma.ts`
**Status final**: ✅ done

---

### S-002 | 2026-11-06 | Gemini | Autor: Agent AI & David Vulcu
**Scop sesiune**: Implementare Modul Student (Partea 1A).
**Realizat**:
- Profil student cu bio, headline, link-uri profesionale (GitHub, LinkedIn, portofoliu).
- Upload CV (PDF, max 10MB) cu stocare pe disc.
- Sistem tag-uri N:M cu nivel de competență (BEGINNER, INTERMEDIATE, ADVANCED).
- 41 competențe predefinite ULBS.
- Preferințe ordonate pentru oferte (`StudentPreference`) cu reordonare tranzacțională.
- Server Actions: `updateStudentProfile`, `updateStudentTags`, `uploadCvFile`, `addStudentPreference`, `reorderStudentPreferences`, `removeStudentPreference`.
**Decizii luate**: ADR-002 (arhitectura matching + scoring + Privacy Gate)
**Fișiere modificate**: `src/app/actions/student.ts`, `src/app/student/`, `src/lib/scoring.ts`, `prisma/schema.prisma`
**Status final**: ✅ done

---

### S-003 | 2026-11-06 | Gemini | Autor: Agent AI & David Vulcu
**Scop sesiune**: Implementare Modul Firmă (Partea 1B).
**Realizat**:
- Profil companie cu CUI/CIF, descriere, persoană de contact.
- Gestiune oferte de practică cu tag-uri obligatorii/opționale și ponderi.
- Clasament aplicanți Gale-Shapley (`CompanyApplicantRank`) cu drag-and-drop.
- Pattern tranzacțional ranguri negative pentru reordonare fără coliziuni.
- Programare sloturi interviuri (tutore propune, student rezervă).
- Privacy Gate: CV accesibil doar dacă studentul a aplicat explicit.
- Server Actions: `upsertInternshipOffer`, `toggleOfferStatus`, `deleteOffer`, `rankApplicant`, `reorderCompanyApplicantRanks`, `removeCompanyApplicantRank`, `createInterviewSlot`, `deleteInterviewSlot`, `bookInterviewSlot`, `cancelInterviewBooking`.
**Decizii luate**: ADR-003 (ranguri negative), ADR-004 (GDPR Privacy Gate)
**Fișiere modificate**: `src/app/actions/company.ts`, `src/app/company/`, `src/lib/privacy.ts`, `prisma/schema.prisma`
**Status final**: ✅ done

---

### S-004 | 2026-11-17 | Gemini | Autor: Agent AI & David Vulcu
**Scop sesiune**: Configurare skill-uri native `/plan` și `/build` + actualizare registru.
**Realizat**:
- Creare `.agents/skills/plan/SKILL.md` (ghid de planificare tehnică riguroasă).
- Creare `.agents/skills/build/SKILL.md` (ghid de execuție implementare).
- Actualizare `DECISIONS.md` cu ADR-003 și ADR-004.
- Actualizare `CONTRACTS.md` cu contractele modulului firmă și student.
- Commit: `53cb4aa chore(agents): configure native /plan and /build skills`.
**Decizii luate**: ADR-004 integrare skill-uri
**Fișiere modificate**: `.agents/skills/plan/SKILL.md`, `.agents/skills/build/SKILL.md`, `docs/agents/DECISIONS.md`, `docs/agents/CONTRACTS.md`
**Status final**: ✅ done

---

### S-005 | 2026-11-17 | Claude Sonnet 4.6 (Thinking) | Autor: Agent AI & David Vulcu
**Scop sesiune**: Aliniere documentație + Design & Mock Coordonator (Partea 2A pregătire).
**Realizat**:
- Creare `CLAUDE.md` (oglindă AGENTS.md + context rapid pentru agenți).
- Creare `DATA.md` (41 competențe reale ULBS + specializări Facultatea de Inginerie).
- Creare `AI_LOG.md` (jurnal sesiuni S-001 → S-005).
- Actualizare `OPEN-QUESTIONS.md` cu întrebările Q-001..Q-006 deschise.
- Adăugare D-005 în `DECISIONS.md` (status inițial `PENDING_CONFIRMATION`, protecție `CONFIRMED`, `cancelPlacementByCompany`).
- Creare `docs/design/DESIGN.md` (design tokens light/dark, fonturi, spațieri).
- Creare `docs/design/registry.yaml` (lista ecranelor DS-).
- Creare mock HTML `docs/design/mocks/DS-007-coordinator-dashboard.html` (status: draft).
**Decizii luate**: D-005
**Status final**: ✅ done

---

### S-006 | 2026-11-18 | Gemini 3.8 Flash (Thinking) | Autor: Agent AI & David Vulcu
**Scop sesiune**: Implementare Partea 2A — Modulul Coordonator Academic & Motorul de Alocare Gale-Shapley (`/build`).
**Realizat**:
- Actualizare schemă Prisma: enum `PlacementStatus` extins cu `CANCELLED_BY_COORDINATOR`, default `Placement.status` setat la `PENDING_CONFIRMATION`, adăugat `cancelledAt` și `cancelReason`. Sincronizat cu `prisma db push` și `prisma generate`.
- Server Actions noi în `src/app/actions/coordinator.ts`: `runMatchingAction`, `confirmPlacement`, `confirmAllPlacements`, `cancelPlacementByCoordinator`, `getCoordinatorDashboardData`, `exportPlacementsCsv`.
- Adăugat Server Action `cancelPlacementByCompany` în `src/app/actions/company.ts` cu declanșare automată de realocare minimală `handleMinimalReallocation`.
- Componente UI Coordonator conform mock DS-007 aprobat: `CoordinatorDashboard`, `StatsCard`, `PlacementsTable`, `RunMatchingButton`, `ExportCsvButton`.
- Integrare vizualizare coordonator în `src/app/page.tsx` și adăugat `src/app/not-found.tsx`.
- Extindere suită de teste în `src/lib/matching.test.ts` (TC-NEW-1 protecție confirmați, TC-NEW-2 anulare companie, TC-NEW-3 confirmare în masă).
- Toate testele și build-ul Next.js de producție au trecut cu succes (exit code 0).
**Decizii luate / ADR**: D-005 implementat
**Fișiere modificate**: `prisma/schema.prisma`, `src/app/actions/coordinator.ts`, `src/app/actions/company.ts`, `src/app/page.tsx`, `src/lib/matching.test.ts`, `docs/agents/CONTRACTS.md`, `AI_LOG.md`, componente în `src/components/coordinator/`
**Status final**: ✅ done

---

### S-007 | 2026-11-23 | Antigravity | Autor: Agent AI & David Vulcu
**Scop sesiune**: Implementare Backend și Securitate pentru Rolul ADMIN (RBAC, Twist P14 Retragere Oferte, Reguli Globale, Management Utilizatori, Anonimizare GDPR, Audit Log).
**Realizat**:
- Actualizare schemă Prisma: enum `PlacementStatus` extins cu `NEPLASAT`, enum `CompanyStatus` (`PENDING`, `APPROVED`, `REJECTED`), enum `AuditActionType`, enum `NotificationType`, enum `TieBreakerRule`. Modele noi: `SystemSettings`, `AuditLog`, `Notification`. Sincronizat cu `prisma db push` și `prisma generate`.
- Securitate & RBAC: middleware `src/middleware.ts` (blocare 403 pentru API neautorizat pe `/api/admin/*`, redirect `/` pentru rute `/admin/*`), layout `src/app/admin/layout.tsx`, guard-uri `src/lib/admin-guard.ts` (`requireAdminUser`, `checkAdminApiAuth`).
- Twist P14 Retragere Oferte: la retragerea unei oferte de către Admin (`PATCH /api/admin/offers/[offerId]/status`), toți studenții alocați sunt marcați `NEPLASAT` cu motiv de realocare minimală, sunt emise notificări către studenți și coordonatori și se înregistrează în `AuditLog`.
- Validare companii: `GET /api/admin/companies`, `PATCH /api/admin/companies/[companyId]/status` (aprobare/respingere + notificare + audit).
- Management utilizatori: `GET /api/admin/users`, `PATCH /api/admin/users/[userId]/role` (prevenire auto-demotare admin), `PATCH /api/admin/users/[userId]/status` (prevenire auto-dezactivare).
- Reguli globale: `GET /api/admin/settings`, `PUT /api/admin/settings` (`required_hours`, `tie_breaker_rule`).
- Anonimizare GDPR la cerere: `POST /api/admin/gdpr/anonymize` conform Art. 17 (`Student_Anonim_<id>`, `anonim_<id>@deleted.local`, ștergere fișier CV fizic, păstrare intactă plasamente și statistici).
- Audit log & Notificări: helper `src/lib/audit.ts` și `src/lib/notifications.ts`, rute `GET /api/admin/audit-logs`, `GET /api/admin/notifications`.
- Suită de teste automate dedicată: `src/lib/admin.test.ts` (7 teste noi, total 24 teste trecute în vitest).
- Typecheck `npx tsc --noEmit` și build complet de producție Next.js (`npm run build`) validate cu succes.
- Implementare Interfață Completă Panou Admin (`/admin`):
  - `AdminHeader`: antet consistent conform design system-ului Coordonator cu badge `ADMIN` (#2563EB), date de identificare și buton `Deconectare`.
  - `CompaniesOffersTab`: carduri KPI rapide (Total Companii, În așteptare, Oferte Active, Locuri Disponibile), tabel companii cu căutare/filtre și acțiuni `Aprobă`/`Respinge`, tabel oferte cu dialog modal de confirmare a retragerii (Twist P14 - avertisment trecere în `NEPLASAT` și notificare studenți/coordonator).
  - `UsersGdprTab`: tabel utilizatori cu căutare/filtrare rol, acțiuni schimbare rol, activare/dezactivare cont și buton dedicat `Anonimizează GDPR` cu modal de confirmare a ștergerii ireversibile conform Art. 17.
  - `SettingsTab`: formular setări globale `required_hours` și `tie_breaker_rule` (`APPLICATION_ORDER` vs `ACADEMIC_SCORE`) cu feedback vizual.
  - `AuditLogTab`: tabel cronologic read-only al acțiunilor critice cu filtrare pe tipul acțiunii și inspector JSON.
  - `AdminDashboard`: orchestrator cu comutare pe 4 tab-uri și sistem de alerte toast.
  - Gestionare elegantă a tuturor stărilor goale (empty states).
**Decizii luate / ADR**: Securitate RBAC Admin, Twist P14 Audit & Notificări, UI Admin Panel P14
**Fișiere modificate**: `prisma/schema.prisma`, `AI_LOG.md`, `src/app/page.tsx`, `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`, `src/components/admin/*`, `src/lib/admin*`
**Status final**: ✅ done

---

### S-008 | 2026-11-25 | Antigravity | Autor: Agent AI & David Vulcu
**Scop sesiune**: Audit de Securitate, RBAC, Prevenire IDOR și Protecție Producție Demo Login pentru lansarea pe Railway.
**Realizat**:
- Audit amănunțit al tuturor rutelor API (`src/app/api/**`) și Server Actions (`src/app/actions/**`).
- Corectare vulnerabilități IDOR pe fluxul de convenții (`src/app/actions/convention.ts`): verificare strictă că acțiunile `getConventionDetails`, `markConventionSignedByStudent`, `uploadSignedConventionScan`, `generateConventionForPlacement` permit accesul exclusiv titularului student, tutorelui companiei ofertei respective sau coordonatorului/adminului.
- Corectare verificare IDOR la ștergerea preferințelor studențești (`src/app/actions/student.ts`).
- Securizare mod de producție (`NEXT_PUBLIC_ENABLE_DEMO_LOGIN="false"`):
  - Helper server-side `isDemoLoginEnabled()` în `src/lib/auth.ts`.
  - Rută API dedicată `POST /api/auth/demo` returnează `403 Forbidden` când flag-ul nu este `"true"`.
  - Protecție server-side în `loginUser` și `switchDemoUserAction`.
  - Ascundere completă în UI a cardului/butoanelor de autentificare demo 1-click.
- Suită dedicată de teste de securitate `src/lib/security-rbac.test.ts` (7 teste automate).
**Decizii luate / ADR**: ADR-008
**Fișiere modificate**: `src/app/actions/convention.ts`, `src/app/actions/student.ts`, `src/lib/auth.ts`, `src/app/api/auth/demo/route.ts`, `src/components/auth-card.tsx`, `src/lib/security-rbac.test.ts`, `docs/agents/DECISIONS.md`, `docs/agents/CONTRACTS.md`
**Status final**: ✅ done

---

### S-010 | 2026-11-26 | Gemini 3.8 Flash | Autor: Agent AI & David Vulcu
**Scop sesiune**: Audit complet și aliniere conform Definition of Done (DoD): Date seed extinse (3 firme + 10 studenți), scenariu de testare Gale-Shapley cu identificare studenți neplasați, previzualizare oficială convenție PDF în README, audit securitate IDOR descărcare CV, filtru rapid studenți neplasați în panoul Coordonatorului.
**Realizat**:
- **Date inițiale complete (Seed)** (`prisma/seed.ts`):
  - 3 firme partenere reprezentative: Continental Sibiu (4 locuri pe 2 oferte), Marquardt Sibiu (2 locuri pe 1 ofertă), KeepCalling Sibiu (1 loc pe 1 ofertă) — total 7 locuri disponibile.
  - 10 studenți cu date academice complete, conturi verificate `@ulbsibiu.ro`, CV-uri atașate și seturi de competențe tehnice din cele 41 de tag-uri ULBS.
  - Preferințe ordonate ale studenților și clasamente ale companiilor pentru a genera un scenariu Gale-Shapley cu 7 studenți plasați și 3 studenți neplasați.
- **Scenarii automate de matching Gale-Shapley** (`src/lib/matching.test.ts`):
  - Adăugat testul `TC-DOD-1: Scenariu complet DoD - 3 companii, 7 locuri, 10 studenți cu Gale-Shapley și determinare neplasați`.
  - Verificat: stabilitatea alocărilor, respectarea strictă a capacităților per ofertă, calculul exact al studenților neplasați (3 studenți liberi).
- **Previzualizare Convenție PDF în documentație** (`README.md` & `docs/images/conventie-pdf-preview.png`):
  - Generat preview PNG de înaltă rezoluție al Convenției-cadru oficiale ULBS folosind scriptul `scripts/generate-pdf-preview.ts` și generatorul nativ PDFKit (`src/lib/pdf/generate-convention-pdf.ts`).
  - Documentat detaliat în `README.md` secțiunea *Verificare Vizuală — Convenția de Practică (PDF)* cu imagine centrată și descrierea anexelor (Portofoliu și Tabel nominal).
- **Securitate descărcare CV împotriva IDOR** (`src/app/api/cv/[filename]/route.ts` & `src/lib/cv-auth.test.ts`):
  - Verificare strictă de autorizare: descărcarea CV-ului este permisă exclusiv studentului proprietar, companiilor la care studentul a aplicat activ (`StudentPreference`), coordonatorului academic și administratorului.
  - Teste unitare dedicate (5 teste în `cv-auth.test.ts`) pentru prevenirea accesului neautorizat (401 neautentificat, 403 firmă neautorizată sau alt student).
- **Filtru rapid studenți neplasați pentru Coordonator** (`src/components/coordinator/*`):
  - Adăugat tab de filtrare rapidă `Neplasați (<count>)` în `PlacementsTable`, alături de filtrele existente (`Toate`, `Confirmate`, `În așteptare`).
  - Extins `getCoordinatorDashboardData` în `src/app/actions/coordinator.ts` pentru a interoga toți studenții din sistem și a calcula lista completă a celor neplasați.
  - Badge distinctiv `NEPLASAT` (#EF4444) și afișare clară în interfața coordonatorului.
- **Validare completă**:
  - Suita de 52 de teste automate trece cu succes (`npm test`).
  - Build de producție Next.js (`npm run build`) trece fără erori de compilare sau de tipuri.
**Decizii luate / ADR**: Aliniere completă Definition of Done conform cerințelor de laborator și caietului de sarcini P14.
**Fișiere modificate**: `prisma/seed.ts`, `src/lib/matching.test.ts`, `src/lib/cv-auth.test.ts`, `src/app/actions/coordinator.ts`, `src/components/coordinator/placements-table.tsx`, `src/components/coordinator/coordinator-dashboard.tsx`, `src/components/coordinator/stats-card.tsx`, `scripts/generate-pdf-preview.ts`, `docs/images/conventie-pdf-preview.png`, `README.md`, `AI_LOG.md`
**Status final**: ✅ done

---

### S-011 | 2026-11-26 | Gemini 3.8 Flash | Autor: Agent AI & David Vulcu
**Scop sesiune**: Aliniere 100% cuvânt cu cuvânt a generatorului oficial de Convenții PDF cu documentul oficial al Facultății de Inginerie ULBS (`Template_Conventie-pentru-efectuarea-stagiului-de-practica-Licenta_2026-2027.docx`).
**Realizat**:
- **Inspecție profundă șablon oficial**: extrasă structura exactă XML, stiluri, margini A4, text și tabele din `.docx`.
- **Generator PDF nativ (`src/lib/pdf/generate-convention-pdf.ts` & `src/lib/conventions/pdf-builder.ts`)**:
  - Eliminat antetul gri din versiunea veche; fundal alb curat, margini standard A4 și font Roboto cu suport UTF-8 complet pentru diacritice românești.
  - Titlu centrat exact ca în template: `CONVENŢIE` / `PRIVIND EFECTUAREA STAGIULUI DE PRACTICĂ` / `NR. ...`.
  - Preambul complet cu datele partenerului (Registrul Comerțului, cod fiscal, cont bancar, bancă, reprezentant legal) și temeiul legal (Legea nr. 258/2007 și Ordinul 3955/2008).
  - Toate cele 12 articole reproduse integral: Art. 1 Obiectul, Art. 2 Statutul, Art. 3 Durata (05.07.2027 – 25.07.2027), Art. 4 Obligațiile practicantului, Art. 5 Obligațiile partenerului, Art. 6 Obligațiile facultății, Art. 7 Persoane desemnate (cu tabelul pe două coloane pentru Tutori și datele Cadrului didactic supervizor), Art. 8 Credite transferabile (4 credite), Art. 9 Raportul și caietul de practică, Art. 10 SSM și protecția socială Legea 346/2002, Art. 11 Confidențialitate (cele 6 puncte integrale), Art. 12 Prevederi finale.
  - Subsol oficial de semnături: Decan Prof.univ.dr.ing. Maria VINȚAN și Director / Partener.
  - **ANEXA 1 (Portofoliu de practică)**: forțată pe pagină nouă (`doc.addPage()`), conține punctele 1–13, tabelul oficial cu cele 4 categorii de competențe, tabelul de evaluatori și semnături.
  - **ANEXA 2 (Tabel nominal)**: forțată pe pagină nouă (`doc.addPage()`), antet pentru anul universitar 2026-2027, tabel cu cele 5 coloane oficiale și semnături.
- **Bază de date (`prisma/schema.prisma`)**:
  - Extins modelul `CompanyProfile` cu câmpurile opționale: `regCom`, `bankAccount`, `bankName`, `legalRepresentative`. Sincronizat cu `prisma db push` și `prisma generate`.
- **Sincronizare HTML Preview & Types**:
  - Actualizat `src/lib/conventions/template-html.ts` și `src/lib/conventions/types.ts` pentru consistență absolută între preview-ul web și PDF-ul descărcabil.
- **Dovezi & Documentație**:
  - Regenerat fișierul PDF de test `docs/images/sample-conventie.pdf` și previzualizarea PNG `docs/images/conventie-pdf-preview.png` via `scripts/generate-pdf-preview.ts`.
  - Actualizat `README.md` secțiunea *Verificare Vizuală — Convenția de Practică (PDF)*.
- **Validare**:
  - Toate cele 52 de teste automate trec cu succes (`npm test`).
  - Build-ul complet Next.js (`npm run build`) validat fără erori.
**Decizii luate / ADR**: Conformitate 100% cu documentele administrative oficiale ULBS Licență 2026-2027.
**Fișiere modificate**: `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/pdf/generate-convention-pdf.ts`, `src/lib/conventions/pdf-builder.ts`, `src/lib/conventions/template-html.ts`, `src/lib/conventions/types.ts`, `src/lib/conventions/generator.ts`, `src/lib/auth.ts`, `docs/images/conventie-pdf-preview.png`, `docs/images/sample-conventie.pdf`, `README.md`, `AI_LOG.md`
**Status final**: ✅ done

---

### S-012 | 2026-11-26 | Gemini 3.8 Flash | Autor: Agent AI & David Vulcu
**Scop sesiune**: Rezolvare cerință G-9 (Google Lighthouse ≥ 90% pe bundle de producție), rafinare etichete UI în limba română pe toate dashboard-urile și verificare comportament seed pentru producție.
**Realizat**:
- **Audit Google Lighthouse (Cerința G-9)**:
  - Rulat audit Lighthouse CLI pe serverul Next.js de producție (`http://localhost:3000`).
  - Obținut scor maxim de **100%** pe toate categoriile evaluate:
    - **Performance**: 100%
    - **Accessibility**: 100%
    - **Best Practices**: 100%
    - **SEO**: 100%
  - Generat și salvat rapoartele complete în `docs/lighthouse-report.report.html` și `docs/lighthouse-report.report.json`.
- **Optimizări de performanță implementate**:
  - **Zero render-blocking fonts**: Eliminat `@import` extern din Google Fonts în `globals.css` și integrat fonturile `Plus_Jakarta_Sans` și `JetBrains_Mono` prin `next/font/google` cu `display: "swap"`.
  - **Optimizare imagine background**: Convertit imaginea blueprint de fundal în format modern WebP (`public/images/inginerie-sibiu-cyber.webp`), reducând dimensiunea fișierului de la 1.1 MB la 65 KB (94% reducere).
  - **Code splitting & dynamic imports**: Izolat dashboard-urile mari (`StudentDashboard`, `CompanyDashboard`, `CoordinatorDashboard`, `RoleDashboardSkeleton`) prin `next/dynamic` în `src/app/page.tsx`, eliminând încărcarea inutilă de JavaScript pe landing page și reducând Total Blocking Time (TBT).
- **Rafinare etichete vizibile în limba română (UI)**:
  - Header: `Companie / Tutore`.
  - Dashboard Admin: `Companii & Oferte`, `Utilizatori & GDPR`, `Setări`, `Jurnal Audit`.
  - Dashboard Companie: `Oferte`, `Candidați`, `Interviuri`, `Pontaje`, `Evaluare`, `Profil Companie`.
  - Dashboard Student: `Oferte`, `Preferințe`, `Profil`, `Convenție Practică`, `Jurnal Activitate`.
  - Păstrat neschimbate toate cheile interne de stare/tab-uri TypeScript.
- **Verificare seed producție (`prisma/seed.ts`)**:
  - Confirmat că la `process.env.NODE_ENV === "production"`, scriptul populează exclusiv nomenclatorul de tag-uri, setările de sistem și conturile administrative (Admin și Coordonator), omițând firmele și studenții demonstrativi.
- **Documentație**:
  - Adăugat secțiunea dedicată auditului Google Lighthouse în `README.md`.
- **Validare completă**:
  - `npm run build` validat cu 0 erori.
  - Toate cele 52 de teste automate trec cu succes (`npm test`).
**Decizii luate / ADR**: Optimizare Core Web Vitals și finalizare cerințe de calitate G-9.
**Fișiere modificate**: `AI_LOG.md`, `README.md`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/components/app-header.tsx`, `src/components/admin/admin-dashboard.tsx`, `src/components/company/company-dashboard.tsx`, `src/components/student/student-dashboard.tsx`, `docs/lighthouse-report.report.html`, `docs/lighthouse-report.report.json`, `public/images/inginerie-sibiu-cyber.webp`
**Status final**: ✅ done

---

### S-013 | 2026-11-26 | Gemini 3.8 Flash | Autor: Agent AI & David Vulcu
**Scop sesiune**: Calibrare exactă pe 5 pagini a Convenției oficiale de practică ULBS (PDF nativ & HTML preview), curățare landing page / formular de autentificare și finalizare sincronizare pe GitHub.
**Realizat**:
- **Calibrare Convenție Oficială PDF (`src/lib/pdf/generate-convention-pdf.ts` & `src/lib/conventions/template-html.ts`)**:
  - Ajustat layout-ul și pauzele de pagină pentru a garanta încadrarea în exact **5 pagini** (3 pagini Convenția + 1 pagină Anexa 1 + 1 pagină Anexa 2), identic cu fișierul Word oficial ULBS Licență 2026-2027.
  - Pagina 1: Antet unic curat fără duplicări de titlu; eliminat prefixul duplicat `Str.` prin funcția `formatCompanyAddress`; aliniere inline pentru datele bancare.
  - Pagina 2-3: ART. 3 cu cratimă en-dash (`01.07.2026 – 30.09.2026`); ART. 7(1) structurat pe două coloane egale (50%-50%) cu ortografierea corectă `Dl/Dna`; resetat cursorul `doc.x = leftMargin` astfel încât ART. 7(2) până la ART. 12 ocupă 100% lățimea paginii; blocuri de semnături pe două coloane stânga-dreapta.
  - Pagina 4 (Anexa 1): Pct. 3 formatat curat, pct. 5 păstrat pe un singur rând, tabelul de competențe compactat astfel încât întreaga anexă (inclusiv semnăturile) se încadrează pe o singură pagină.
  - Pagina 5 (Anexa 2): Antet `studenţii anului ${studyYear}`, nume student formatat în Title Case (`Alex Barac`), tabel nominal pe 5 coloane și semnături pe două coloane.
- **Curățare Landing Page / Formular Autentificare (`src/app/page.tsx`)**:
  - Eliminat paragraful introductiv redundant referitor la Gale-Shapley și catalogul de competențe.
  - Eliminat complet blocul „ARHITECTURĂ DE SISTEM” / „Modulele Platformei de Practică” (cele 3 carduri de prezentare module).
  - Curățat importurile Lucide Icons neutilizate (`Building2`, `GraduationCap`, `ShieldCheck`, `Cpu`, `Layers`).
  - Centrat formularul de autentificare/înregistrare vertical în viewport (`my-auto`, `justify-center`, `mt-auto` pe footer), eliminând spațiul gol inutil din partea inferioară a ecranului.
- **Validare completă**:
  - Toate cele 52 de teste automate trec cu succes (`npm test`).
  - Build-ul de producție Next.js (`npm run build`) trece cu 0 erori.
**Decizii luate / ADR**: Conformitate 100% cu șablonul administrativ ULBS și simplificare vizuală a primului ecran pentru utilizatori.
**Fișiere modificate**: `src/lib/pdf/generate-convention-pdf.ts`, `src/lib/conventions/template-html.ts`, `src/app/page.tsx`, `docs/images/sample-conventie.pdf`, `docs/images/conventie-pdf-preview.png`, `AI_LOG.md`
**Status final**: ✅ done
