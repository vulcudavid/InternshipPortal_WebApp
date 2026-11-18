# CLAUDE.md — Referință pentru Agenți AI (Claude / Antigravity)

> Acest fișier este oglinda regulilor din [AGENTS.md](./AGENTS.md) și furnizează context suplimentar pentru sesiunile de lucru. În caz de conflict, **AGENTS.md are prioritate absolută**.

---

## Reguli Fundamentale (din AGENTS.md)

1. **Nu inventează cerințe sau date personale** — bazează-te exclusiv pe `docs/brief.md`, `docs/agents/CONTRACTS.md` și cerințele explicite ale utilizatorului.
2. **Codul are prioritate față de documentație** — investighează codul real din `src/` și schema Prisma înainte de orice presupunere.
3. **NU face `git push` sau `gh repo create` fără acordul explicit al utilizatorului.**

---

## Fluxul Obligatoriu de Lucru (Ghid de Laborator)

```
Artefacte → Design Mock (confirmed) → /plan → /build (pe branch)
```

**Nu sări niciun pas.** La fiecare parte nouă:
1. Verifică starea documentației și mockurilor (Pasul Artefacte).
2. Creează sau actualizează mock-ul HTML în `docs/design/mocks/`.
3. Așteaptă confirmarea explicită a utilizatorului (`approved`).
4. Generează planul tehnic cu `/plan` (skill: `.agents/skills/plan/SKILL.md`).
5. Implementează cu `/build` (skill: `.agents/skills/build/SKILL.md`) pe un branch dedicat.

---

## Structura Proiectului (referință rapidă)

| Cale | Scop |
|------|------|
| `docs/brief.md` | Cerințele oficiale P14 |
| `docs/agents/DECISIONS.md` | Registru ADR (decizii aprobate) |
| `docs/agents/CONTRACTS.md` | Contracte API & modele de date |
| `docs/agents/OPEN-QUESTIONS.md` | Întrebări deschise Q- |
| `docs/agents/PATTERNS.md` | Șabloane de cod & bune practici |
| `docs/design/DESIGN.md` | Design tokens (culori, fonturi, spațieri) |
| `docs/design/registry.yaml` | Registrul ecranelor DS- |
| `docs/design/mocks/` | Mock-uri HTML/CSS per ecran |
| `docs/agents/tools/ledger-lint.py` | Linter registru decizii |
| `AI_LOG.md` | Jurnal sesiuni AI |
| `DATA.md` | Date reale catalog P14 (ULBS) |
| `src/` | Codul sursă Next.js |
| `prisma/schema.prisma` | Schema bazei de date |

---

## Stack Tehnic Aprobat (ADR-001)

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Bază de date**: PostgreSQL 16 (Docker Compose)
- **ORM**: Prisma ORM
- **Styling**: Tailwind CSS + Lucide Icons

---

## Decizii Cheie Aprobate

| ID | Titlu | Status |
|----|-------|--------|
| ADR-001 | Stiva tehnologică Next.js + PostgreSQL + Prisma | approved |
| ADR-002 | Arhitectură matching, scoring & Privacy Gate | approved |
| ADR-003 | Pattern tranzacțional ranguri negative (reordonare) | approved |
| ADR-004 | GDPR Privacy Gate - exclusivitate pe preferința studentului | approved |
| D-005 | Plasamente: status inițial `PENDING_CONFIRMATION`, protecție `CONFIRMED`, `cancelPlacementByCompany` | approved |

---

## Convenții de Cod

- Server Actions în `src/app/actions/*.ts`
- Funcții pure testabile în `src/lib/*.ts`
- Componente UI în `src/components/*.tsx`
- Nu importa Prisma Client direct în componente — folosește Server Actions sau Route Handlers
- Privacy Gate obligatoriu în orice endpoint care returnează date de student

---

## Comenzi Rapide

```bash
npm run dev          # dev server :3000
npm run db:up        # pornește PostgreSQL
npm run db:push      # aplică schema Prisma
python3 docs/agents/tools/ledger-lint.py  # validare registru
```
