# Instruktion fuer Gemini: Repo-Review (IST-Zustand) + Next-Step-Plan

## Rolle
Du bist Lead Reviewer (Tech + Product/Design Compliance) fuer das $HORNY-Repository.
Dein Auftrag ist Bestandsaufnahme (IST) gegen den final definierten Zielzustand und daraus einen konkreten Next-Step-Plan abzuleiten.

---

## Ziel
1. IST-Zustand feststellen (funktional, visuell, technisch, Doku/CI).
2. Abweichungen (Diff) zum Zielzustand identifizieren und priorisieren.
3. Next Steps planen: klare Tasks, Reihenfolge, Risiko, Aufwandsschaetzung (grob), Owner-Rollen.

---

## Arbeitsgrundlage (Soll-Zustand, verbindlich)
Bewerte das Repo gegen diese verbindlichen Leitplanken:

- Scope/Pages/Design Laws/PageSpec-Token-Enforcement/Release Readiness aus den finalen Uebergabe-Dokumenten.
- Kanonische Quellen im Repo (falls vorhanden, priorisiert):
  - `docs/page-spec.md`
  - `docs/launch-checklist.md`
  - `docs/architecture_current_state.md`
  - `docs/frontend.md`, `docs/backend.md`
  - `docs/assets.md`, `docs/copy.md`
  - `docs/state-machines.md`
  - `docs/ownership.yml`
  - `docs/horny-matrix/*`
  - `docs/review/*`, `docs/planning/*`
- Landing Hero Zielbild (Logo zentriert, Ticker "$HORNY", 3 Social Icons, keine CTA/Animation).
- Teaser/Locked Verhalten (blurred, desaturated, non-interactive, keine API Calls/Inputs).

---

## Vorgehen (Schritte)

### 1) Repo-Discovery (Struktur & Einstieg)

- Framework/Stack: Vite + React + React Router, Tailwind. Backend separat in `server/` (Express + TS).
- Einstiegspunkte:
  - Routing: `src/App.tsx` (React Router)
  - Pages: `src/pages/*.tsx` (barrel: `src/pages/index.ts`)
  - Layout/Shell: `src/components/layout/PageShell.tsx` (setzt data-* Tokens auf `body`)
  - Layout/Globals: `src/components/layout/Navbar.tsx`, `src/components/layout/Footer.tsx`
  - Design Tokens/Styles: `tailwind.config.ts`, `src/index.css`, `src/App.css`
  - Landing: `src/pages/IndexPage.tsx`, `src/components/home/Hero.tsx`, `src/components/home/LiveTicker.tsx`
  - Teaser/Locked: `src/components/ui/TeaserLayout.tsx`, `src/pages/ForgePage.tsx`, `src/pages/GamePage.tsx`, `src/pages/BadgesPage.tsx`
  - Assets: `public/` (client), `server/public/hero_socials_and_logo_icons/` (Hero Icons/Logo)
  - Server: `server/src` (routes/controllers/services), `server/public` (static)

**Output:** kurze Architektur-Skizze + "wo sitzt was".

---

### 2) Build-/CI-Gesundheit (Release Gate)

Frontend (Repo root):
- `npm ci`
- `npm run build`
- `npm run lint`
- `npm test` (delegiert server tests)
- optional: `npm run typecheck`

Backend (`server/`):
- `npm ci`
- `npm run build`
- `npm test`

CI:
- `.github/workflows/ci.yml`
- `.github/workflows/docs-guard.yml`

**Output:** Status (gruen/rot), Fehlerlogs zusammengefasst, konkrete Fix-Empfehlungen.

---

### 3) Routen- und State-Compliance

Pruefe, ob die canonical routes existieren und korrekt sind:
- `/` Landing (Active)
- `/feed` (Active)
- `/interact` (Active)
- `/profile` (Active)
- `/game` (Teaser)
- `/forge` (Teaser)
- `/badges` (Locked)

Routing-Referenz (aktuelle Pfade in `src/App.tsx`):
- `/` -> `src/pages/IndexPage.tsx`
- `/interact` -> `src/pages/Interact.tsx`
- `/profile` -> `src/pages/Profile.tsx`
- `/game` -> `src/pages/GamePage.tsx`
- `/forge` -> `src/pages/ForgePage.tsx`
- `/badges` -> `src/pages/BadgesPage.tsx`
- Feed-Page: `src/pages/Archives.tsx` setzt `page="feed"` und ist an `/gallery` sowie `/archives` geroutet. Pruefen, ob ein canonical `/feed` Pfad fehlt oder bewusst gemappt ist.

Fuer jede Route pruefen:
- Gibt es eine PageSpec-Deklaration?
- Wird via PageShell gerendert? (`src/components/layout/PageShell.tsx`)
- Required tokens gesetzt?
  - `data-page`, `data-state`, `data-flavor`, `data-energy`, optional `data-tier`
- State-Regeln:
  - Teaser/Locked: blurred, desaturated, non-interactive
  - Kein Input, keine API Calls, keine Pulse-Animationen

**Output:** Tabelle pro Route: gefunden/fehlt, Tokens ok/fehlen, State ok/abweichend, Notes.

---

### 4) Design Laws & UI-Regression Checks

Bewerte global (Basis: `docs/page-spec.md`):
- Dark-first umgesetzt?
- Pro Seite genau eine Akzentfarbe (keine Drift)?
- Motion strikt nach Energy, keine pulsing backgrounds?
- Keine Fake/Placeholder KPIs?
  - KPI-Quelle: `src/components/home/LiveTicker.tsx`, `lib/hooks/useTokenStats.tsx`
- Social CTAs icons-only?
  - `src/components/ui/SocialGroup.tsx`
- Contract Address: full-length, monospace, nicht animiert, optional copy
  - `src/components/ui/ContractAddress.tsx`

**Output:** Liste Pass/Fail + konkrete Fundstellen (Dateipfade/Komponenten).

---

### 5) Landing Hero: Umsetzung gegen Zielbild

Pruefe im Code und (wenn moeglich) im Running Build:
- Logo exakt horizontal/vertikal zentriert, keine Animation/FX
- Ticker Text: "$HORNY" direkt darunter (keine Unterzeile/Claim im Hero)
- Darunter 3 Icons: Dexscreener, X, Discord
- Keine Buttons/CTAs/Badges/Scroll Hints im Hero
- Assets:
  - `server/public/hero_socials_and_logo_icons/`
- Links: `target="_blank"`, `rel="noopener noreferrer"`, sinnvolle `aria-labels`
  - `src/components/ui/SocialGroup.tsx`

**Output:** Hero Compliance Report + Fix-Liste (falls Abweichungen).

---

### 6) Doku-Kanon & Repo-Hygiene

- Existieren kanonische Docs (siehe Arbeitsgrundlage)?
- Liegt Legacy korrekt unter `docs/archive/`?
- Gibt es veraltete, widerspruechliche Dokumente in aktiven Pfaden?

**Output:** Doku-Status + Aufraeum-/Move-Vorschlaege.

---

## Ergebnisformat (muss am Ende geliefert werden)

### A) IST-Report (max. 1–2 Seiten)
- Stack/Architektur (kurz)
- CI/Build/Test Status
- Route/Token/State-Compliance Tabelle
- Wichtigste UI/Design-Law Findings
- Doku-Status

### B) Gap-Liste (priorisiert)
Fuer jeden Punkt:
- **Severity:** Blocker / High / Medium / Low
- **Kategorie:** Build/CI, Routing, Design Tokens, Hero, Teaser/Locked, KPIs, Docs
- **Beleg:** Pfad/Komponente + kurze Beschreibung
- **Fix-Vorschlag:** konkret (was aendern)

### C) Next-Step-Plan (umsetzbar)
- 5–15 Tasks, in sinnvoller Reihenfolge
- Grobe Aufwaende (S/M/L)
- Empfohlene Owner-Rollen (FE, BE, Design QA)
- Risiken/Abhaengigkeiten
- Definition of Done pro Task (testbar)

---

## Arbeitsregeln
- Keine Annahmen ohne Beleg im Repo (Pfad/Code/Config).
- Keine neuen Features ausserhalb des finalen Scopes.
- Aenderungen nur als Regression-Fix oder Release-Gate begruenden.
- Fokus: Stabilitaet, Compliance, Drift-Vermeidung.

