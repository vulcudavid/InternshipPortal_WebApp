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

### S-007 | 2026-11-18 | Gemini 3.8 Flash (Thinking) | Autor: Agent AI & David Vulcu
**Scop sesiune**: Implementare Defalcare Statistici pe Specializări & Filtrare în Dashboard Coordonator (`/build`).
**Realizat**:
- Extindere `src/lib/specializations.ts` cu interfața `SpecializationStat`, etichete prietenoase `formatEngineeringDomain` și funcția pură de agregare `computeSpecializationBreakdown`.
- Actualizare `getCoordinatorDashboardData` din `src/app/actions/coordinator.ts` pentru colectarea automată a distribuției pe secții a celor 13 programe de studii ale Facultății de Inginerie ULBS.
- Componentă nouă `SpecializationsBreakdown` în `src/components/coordinator/specializations-breakdown.tsx` cu indicatori de progres, alerte de atenție pentru studenți nealocați și filtrare interactivă.
- Actualizare `PlacementsTable` în `src/components/coordinator/placements-table.tsx` cu bară de căutare dinamică (nume student, grupă, firmă, titlu), selecție specializare și status, numărători sincronizate și resetare rapidă.
- Sincronizare stare de filtrare în `CoordinatorDashboard` între tabelul de plasamente și secțiunea de specializări.
- Adăugare test unitar TC-NEW-4 în `src/lib/matching.test.ts` pentru validarea calculului granular și a consistenței cu sumele globale.
- Rulat cu succes verificările: `tsc --noEmit`, `matching.test.ts`, `privacy.test.ts`, `ledger-lint.py` și `npm run build` (exit code 0).
**Decizii luate / ADR**: Consolidare D-005, ADR-001
**Fișiere modificate**: `src/lib/specializations.ts`, `src/app/actions/coordinator.ts`, `src/components/coordinator/specializations-breakdown.tsx`, `src/components/coordinator/placements-table.tsx`, `src/components/coordinator/coordinator-dashboard.tsx`, `src/lib/matching.test.ts`, `docs/agents/CONTRACTS.md`, `AI_LOG.md`
**Status final**: ✅ done
