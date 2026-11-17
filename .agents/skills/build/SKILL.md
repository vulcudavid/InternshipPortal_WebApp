---
name: build
description: >-
  Execută implementarea conform unui plan tehnic aprobat (/plan), dezvoltă funcționalități,
  rulează suita de teste automate și actualizează registrul tehnic de arhitectură.
  Se activează la comanda /build sau când utilizatorul confirmă începerea execuției.
  Respectă cu strictețe regulile fundamentale din AGENTS.md.
---

# Skill: /build - Execuție, Dezvoltare & Verificare

Acest skill ghidează agentul în implementarea efectivă a funcționalităților aprobate într-un plan anterior (`/plan`), asigurând calitatea codului, rularea testelor automate și conformitatea cu regulile proiectului **P14 (Portal de Practică)**.

---

## 1. Reguli Fundamentale Obligatorii (din AGENTS.md)

1. **Nu inventează cerințe sau date personale**:
   - Implementează doar funcționalitățile agreate în plan.
   - Respectă confidențialitatea GDPR: un student are datele private (CV, telefon) mascate până la aplicarea la o ofertă a companiei respective.
2. **Codul are prioritate față de documentație**:
   - Asigură-te că logica din Server Actions și componente este robustă, deterministă și type-safe înainte de a actualiza fișierele de documentație.
3. **NU face `git push` sau `gh repo create` fără acordul explicit al utilizatorului**:
   - Finalizarea unui build se realizează local. Nu da push pe GitHub decât dacă utilizatorul cere explicit acest lucru printr-un mesaj separat.

---

## 2. Etapele Fluxului de Dezvoltare (/build)

### Pasul 1: Baza de Date & Modele Prisma (dacă este cazul)
1. Editează [prisma/schema.prisma](../../../prisma/schema.prisma).
2. Sincronizează schema cu baza de date:
   ```bash
   npx prisma db push
   ```
3. Regenerează clientul Prisma:
   ```bash
   npx prisma generate
   ```

### Pasul 2: Backend & Server Actions
1. Creează/actualizează Server Actions în `src/app/actions/` (ex: `company.ts`, `student.ts`, `coordinator.ts`).
2. Validează rolul utilizatorului autentificat folosind `getCurrentUser()` din `src/lib/auth.ts`.
3. Pentru operațiuni ce implică clasamente ordonate cu constrângere unică pe rang (`@@unique([offerId, rank])` sau `@@unique([studentId, rank])`), folosește întotdeauna tranzacția sigură în 2 pași cu **ranguri negative temporare**.

### Pasul 3: Interfață Utilizator & Experiență Vizuală (UI/UX)
1. Construiește componentele modular în `src/components/`.
2. Asigură un design modern, aerisit și odihnitor pentru ochi:
   - Folosește fontul *Plus Jakarta Sans* și nuanțe relaxante de ardezie (`slate-50`, `slate-100`).
   - Evită pereții denși de text care frustrează utilizatorul; structurează conținutul pe carduri bine spațiate cu iconuri grafice intuitive (*Lucide React*).
   - Pentru formulare complexe de editare a profilului, oferă mod de vizualizare curat și afișează formularele doar când utilizatorul apasă butonul de editare.
   - La conectarea studentului, afișează implicit ofertele de practică recomandate.

### Pasul 4: Teste Automate & Verificare Calitate Cod
După finalizarea modificărilor, rulează obligatoriu verificările:
1. **Verificare Type-Safety**:
   ```bash
   npx tsc --noEmit
   ```
2. **Rulare Teste Unitare**:
   ```bash
   npx tsx src/lib/privacy.test.ts
   npx tsx src/lib/matching.test.ts
   ```
3. **Validare Registru Arhitectură**:
   ```bash
   python3 docs/agents/tools/ledger-lint.py
   ```
4. **Verificare Build de Producție**:
   ```bash
   npm run build
   ```

### Pasul 5: Documentare & Artefact Walkthrough
1. Actualizează contractele modificate în [docs/agents/CONTRACTS.md](../../../docs/agents/CONTRACTS.md).
2. Creează sau actualizează artefactul de tip Walkthrough:
   - **Cale**: `<Artifact Directory>/walkthrough.md`
   - Documentează componentele adăugate, rezultatele testelor automate și scenariile de verificare manuală.

### Pasul 6: Raportare către Utilizator
- Prezintă un rezumat clar, concis, cu link-uri către fișierele create/modificate.
- Menționează că serverul poate fi testat local la `http://localhost:3000`.
- **Așteaptă acordul explicit** înainte de a comite și a împinge modificările pe GitHub (`git push`).
