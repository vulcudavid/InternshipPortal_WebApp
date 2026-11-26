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

### S-009 | 2026-11-25 | Antigravity | Autor: Agent AI & David Vulcu
**Scop sesiune**: Implementare Verificare Obligatorie Email OTP din 6 Cifre pentru Studenți (`@ulbsibiu.ro`).
**Realizat**:
- Extindere model Prisma `User`: `emailVerified Boolean @default(false)`, `verificationCodeHash String?`, `verificationCodeExpiresAt DateTime?`.
- Migrare Prisma aplicată curat: `prisma/migrations/20261125204019_add_email_verification`.
- Sincronizare `prisma/seed.ts` și `src/app/actions/admin.ts` (`adminCreateUser` setează `emailVerified: true`).
- Serviciu de email `src/lib/mailer.ts` bazat pe `nodemailer`, cu suport pentru configurare `SMTP_*` și fallback de consolă în dev/test (`[MAILER FALLBACK] Code for <email>: <code>`).
- Actualizare `.env.example` cu variabilele `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
- Logică auth completă în `src/lib/auth.ts` și Server Actions în `src/app/actions/auth.ts`:
  - `registerStudent`: hash-uire cod OTP cu `bcryptjs` (salt 10), expirare 15 minute, expediere email, returnare `{ requiresVerification: true, email }` fără emitere sesiune.
  - `verifyEmailCode`: validare cod, trecere `emailVerified: true`, curățare hash/expirare și logare automată.
  - `resendVerificationCode`: rate-limiting cu cooldown strict de 60 de secunde (`COOLDOWN_ACTIVE`).
  - `loginUser`: blocare autentificare dacă `user.emailVerified === false` cu codul `EMAIL_NOT_VERIFIED`.
- Interfață UI în `src/components/auth-card.tsx` cu formular dedicat introducere OTP 6 cifre și timer de cooldown pentru retrimitere.
- Suită de teste automate dedicată `src/lib/email-verification.test.ts` (7 teste unitare). Toate cele 10 fișiere de test trecute (47/47 teste).
- Verificare build complet de producție `npm run build` reușit.
**Decizii luate / ADR**: ADR-009
**Fișiere modificate**: `prisma/schema.prisma`, `prisma/migrations/*`, `prisma/seed.ts`, `src/lib/mailer.ts`, `.env.example`, `src/lib/auth.ts`, `src/app/actions/auth.ts`, `src/app/actions/admin.ts`, `src/components/auth-card.tsx`, `src/lib/email-verification.test.ts`, `docs/agents/DECISIONS.md`, `docs/agents/CONTRACTS.md`, `README.md`
**Status final**: ✅ done
