---
name: plan
description: >-
  Creează un plan tehnic detaliat de implementare (Implementation Plan) înainte de a modifica fișiere sau cod.
  Se activează când utilizatorul cere un plan de lucru, o strategie sau folosește comanda /plan.
  Respectă cu strictețe regulile fundamentale din AGENTS.md.
---

# Skill: /plan - Planificare Tehnică Riguroasă

Acest skill ghidează agentul în crearea unui plan de implementare detaliat, structurat și sigur înainte de a scrie sau modifica fișiere de cod în proiectul **P14 (Portal de Practică)**.

---

## 1. Reguli Fundamentale Obligatorii (din AGENTS.md)

1. **Nu inventează cerințe sau date personale**:
   - Bazează-te exclusiv pe cerințele exprimate în [docs/brief.md](../../../docs/brief.md), în contractele din [docs/agents/CONTRACTS.md](../../../docs/agents/CONTRACTS.md) și în cerințele explicite ale utilizatorului.
   - Respectă principiile GDPR (Privacy Gate): datele de contact și CV-urile studenților sunt protejate și accesibile exclusiv dacă există o preferință/aplicație activă a studentului.
2. **Codul are prioritate față de documentație**:
   - Investigați întotdeauna codul real existent, schema Prisma și testele curente înainte de a face presupuneri bazate pe specificații vechi.
3. **NU face `git push` sau `gh repo create` fără acordul explicit al utilizatorului**:
   - Comenzile care interacționează cu repository-ul remote sunt strict interzise fără permisiune verbală directă.

---

## 2. Etapele Fluxului de Planificare

### Pasul 1: Investigare & Aliniere
- Explorează fișierele relevante din `src/`, `prisma/schema.prisma` și `docs/`.
- Verifică dependențele, constrângerile de unicitate din baza de date și algoritmii existenți (Gale-Shapley în `src/lib/matching.ts`, Privacy Gate în `src/lib/privacy.ts`, Scoring în `src/lib/scoring.ts`).
- Identifică orice neclaritate sau decizie critică și formuleaz-o ca întrebare deschisă către utilizator.

### Pasul 2: Crearea Artefactului de Plan
Creează artefactul markdown în directorul de artefacte al conversației:
- **Cale**: `<Artifact Directory>/<plan_name>.md`
- **Metadata obligatorie**:
  - `RequestFeedback: true` (oferă utilizatorului butonul de „Proceed”/Aprobare)
  - `UserFacing: true`

### Pasul 3: Structura Standard a Planului de Implementare

Planul trebuie să respecte structura:

```markdown
# Plan de Implementare: [Titlu Funcționalitate]

## Goal Description
Descriere concisă a problemei, contextul tehnic și ce va realiza implementarea.

## User Review Required
Decizii de arhitectură, migrări de bază de date (ex: constrângeri unice noi, `prisma db push`) sau modificări de flux ce necesită validarea utilizatorului. Utilizați alerte GitHub `> [!IMPORTANT]`, `> [!WARNING]`.

## Open Questions
Întrebări clarificatoare pentru utilizator înainte de execuție.

## Proposed Changes
Modificările grupate logic pe componente, cu demarcație clară:
- [NEW] cale/fisier
- [MODIFY] cale/fisier
- [DELETE] cale/fisier
Descrieți explicit semnăturile funcțiilor, Server Actions, rutele API și structura componentelor.

## Verification Plan
### Automated Tests
Comenzile exacte pentru teste unitare și de integrare (ex: `npx tsx src/lib/privacy.test.ts`, `npx tsx src/lib/matching.test.ts`, `npx tsc --noEmit`).
### Manual Verification
Pași conciși de testare manuală în browser (pe rolurile Student, Firmă sau Coordonator).
```

### Pasul 4: Stop & Așteptare Aprobare
- **NU modifica niciun fișier de cod** înainte de aprobarea explicită a utilizatorului.
- După crearea planului, trimite un mesaj scurt în chat care pointează către fișierul planului și menționează deciziile critice deschise.
- Așteaptă confirmarea utilizatorului (sau comanda `/build`).
