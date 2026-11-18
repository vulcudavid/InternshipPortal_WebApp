# Întrebări Deschise (Q-)

Registrul întrebărilor deschise pentru proiectul **P14 Portal de Practică ULBS**.
Fiecare întrebare primește un ID `Q-NNN`, data înregistrării și statusul.

> **Status-uri**: `open` | `answered` | `deferred`

---

## Q-001 | 2026-11-06 | open
**Modul**: Matching Gale-Shapley
**Întrebare**: Algoritmul Gale-Shapley rulează o singură dată (batch) sau poate fi re-rulat incremental pe noi studenți/oferte adăugate după prima rulare?
**Context**: Afectează dacă plasamentele existente rămân stabile sau pot fi perturbate la re-rulare.
**Legat de**: D-005 (protecție plasamente `CONFIRMED`)

---

## Q-002 | 2026-11-06 | open
**Modul**: Coordonator Academic
**Întrebare**: Coordonatorul poate anula manual un plasament `CONFIRMED` (ex: situație excepțională) sau doar firma poate folosi `cancelPlacementByCompany`?
**Context**: Necesită clarificarea rolului adminului vs. coordonatorului în fluxul de excepții.
**Legat de**: D-005

---

## Q-003 | 2026-11-06 | open
**Modul**: Convenție de Practică (PDF)
**Întrebare**: Convenția PDF este generată automat la plasamentul confirmat sau la o acțiune explicită a coordonatorului?
**Context**: Influențează UI-ul Dashboard-ului Coordonator (buton „Generează Convenții" vs. generare automată în background).

---

## Q-004 | 2026-11-06 | open
**Modul**: Notificări
**Întrebare**: Sistemul include notificări prin email (SMTP) sau exclusiv notificări in-app (badge, toast)?
**Context**: Email-ul necesită configurare SMTP suplimentară și posibil un serviciu extern (Resend, SendGrid).

---

## Q-005 | 2026-11-17 | open
**Modul**: Dashboard Coordonator
**Întrebare**: Export CSV/Excel al plasamentelor — include și datele de contact ale studenților (email, telefon) sau doar informații academice anonimizate?
**Context**: Implicații GDPR — coordonatorul are acces diferit față de firmă.

---

## Q-006 | 2026-11-17 | open
**Modul**: Design / UI
**Întrebare**: Se folosește un singur design system (tokens din `DESIGN.md`) pentru toate rolurile (Student, Firmă, Coordonator, Admin) sau fiecare rol are o temă de culoare diferită?
**Context**: Ghidul de laborator menționează mock-uri per ecran; e nevoie de confirmare pentru registry.yaml.
