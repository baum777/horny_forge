---
name: Release-Gate Sofort-Sequenz
overview: "Abarbeitung der 5 Phasen zur Release-Readiness: Hero minimalisieren, Teaser/Locked non-interactive machen, canonical /feed Route einrichten, PageShell 100% durchsetzen, und Frontend Build in CI integrieren."
todos: []
---

# Release-Gate Sofort-Sequenz Abarbeitung

## Phase 1: Hero (Landing) minimalisieren

**Datei:** [`src/components/home/Hero.tsx`](src/components/home/Hero.tsx)

**Änderungen:**

- Entfernen: Alle `framer-motion` Imports und Animationen
- Entfernen: Badge ("The Playground is Open")
- Entfernen: Headline aus `copyContent.landing.hero.headline`
- Entfernen: Subline aus `copyContent.landing.hero.subline`
- Entfernen: CTAs (Buttons)
- Entfernen: Trust Microcopy
- Entfernen: `ContractAddress` Component
- Entfernen: `LiveTicker` Component (Zeile 91-94)
- Entfernen: `SocialGroup` Component
- Neu: Logo als `<img>` aus `server/public/hero_socials_and_logo_icons/hero-logo.png`
- Neu: Statischer Text `$HORNY` unter dem Logo
- Neu: 3 Social-Icons direkt als `<img>` + `<a>` Links:
                - Dexscreener: `dexscreener-icon.svg` → URL: `https://dexscreener.com/solana/EARThGewsskrBg6CMvX9dDxNtniAC4sHMSTHR5NNxWji`
                - X: `x.svg` → URL: `https://x.com/i/communities/2009563480613949770`
                - Discord: `discord-icon.svg` → URL: `https://discord.com/channels/1439751512091005042/1446863164808364255`
- Links mit `target="_blank"`, `rel="noopener noreferrer"`, `aria-label`

**DoD:** Keine `framer-motion` Imports, keine `animate-*` Klassen, Hero nutzt nur Image-Assets.

---

## Phase 2: Teaser / Locked = non-interactive

**Dateien:**

- [`src/components/ui/TeaserLayout.tsx`](src/components/ui/TeaserLayout.tsx)
- [`src/pages/GamePage.tsx`](src/pages/GamePage.tsx)
- [`src/pages/ForgePage.tsx`](src/pages/ForgePage.tsx)
- [`src/pages/BadgesPage.tsx`](src/pages/BadgesPage.tsx)

**Änderungen:**

1. **TeaserLayout.tsx:**

                        - Navbar-Rendering basierend auf `state` deaktivieren oder vollständig entfernen
                        - Wenn PageShell `spec.state` `teaser` oder `locked` ist, Navbar nicht rendern
                        - Oder: `pointer-events: none` auf Container anwenden wenn state `teaser`/`locked`

2. **GamePage.tsx:**

                        - Zeile 22: `animate-pulse` entfernen
                        - Prüfen auf weitere Animationen

3. **ForgePage.tsx & BadgesPage.tsx:**

                        - Prüfen auf `animate-pulse` oder andere Animationen

4. **Navbar.tsx:**

                        - Optional: Conditional Rendering basierend auf Route-State (wenn via Context/Prop verfügbar)

**DoD:**

- `grep -R "animate-pulse" src/pages/GamePage.tsx src/pages/ForgePage.tsx src/pages/BadgesPage.tsx` → keine Treffer
- In TeaserLayout: Navbar nicht gerendert ODER `pointer-events: none` aktiv für `state: teaser | locked`

---

## Phase 3: Canonical Routing `/feed`

**Datei:** [`src/App.tsx`](src/App.tsx)

**Änderungen:**

- Neue Route hinzufügen: `<Route path="/feed" element={<Archives />} />`
- Positionierung: Vor oder gleichwertig mit `/gallery` und `/archives`
- `/gallery` und `/archives` bleiben als Legacy-Routes (gleiches UI, gleiche Tokens)

**Hinweis:** [`src/pages/Archives.tsx`](src/pages/Archives.tsx) nutzt bereits `PageShell` mit `page: "feed"` (Zeile 32), daher ist nur die Route erforderlich.

**DoD:**

- `/feed` Route existiert in `App.tsx`
- Aufruf von `/feed` zeigt Feed-UI (Archives Component)
- `document.body.dataset.page === "feed"` wird gesetzt

---

## Phase 4: PageShell Enforcement (100%)

**Dateien:**

- [`src/pages/LandingPage.tsx`](src/pages/LandingPage.tsx)
- [`src/pages/DashboardPage.tsx`](src/pages/DashboardPage.tsx)
- [`src/pages/StatusPage.tsx`](src/pages/StatusPage.tsx)
- [`src/pages/ActionsPage.tsx`](src/pages/ActionsPage.tsx)
- [`src/pages/RewardsPage.tsx`](src/pages/RewardsPage.tsx)
- [`src/pages/NotFound.tsx`](src/pages/NotFound.tsx)
- [`src/pages/Dashboard.tsx`](src/pages/Dashboard.tsx) (wird in App.tsx verwendet für `/dashboard`)

**Änderungen:**

Jede Page wird in `PageShell` gewrappt mit mindestens:

- `page`: Route-Name (z.B. "landing", "dashboard", "status", "actions", "rewards", "notfound")
- `flavor`: Angemessener Wert (z.B. "default", "subtle")
- `energy`: Zahl (z.B. 1, 2)
- `state`: Optional, falls anwendbar

**Beispiele:**

- LandingPage: `page: "landing"`, `flavor: "default"`, `energy: 1`
- DashboardPage: `page: "dashboard"`, `flavor: "default"`, `energy: 2`
- StatusPage: `page: "status"`, `flavor: "subtle"`, `energy: 1`
- ActionsPage: `page: "actions"`, `flavor: "default"`, `energy: 2`
- RewardsPage: `page: "rewards"`, `flavor: "subtle"`, `energy: 1`
- NotFound: `page: "notfound"`, `flavor: "default"`, `energy: 1`
- Dashboard: `page: "dashboard"`, `flavor: "default"`, `energy: 2`

**DoD:**

- Alle genannten Pages nutzen `PageShell`
- `grep -R "export default function.*Page" src/pages/*.tsx` → alle nutzen PageShell
- Manuelle Prüfung: Jede Route setzt `data-page`, `data-flavor`, `data-energy` auf `document.body`

---

## Phase 5: CI Frontend Build

**Datei:** [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

**Änderungen:**

- Nach "Typecheck frontend" (Zeile 38) neuen Step hinzufügen:
  ```yaml
 - name: Build frontend
    run: npm run build
  ```

- Position: Vor "Install server deps" (Zeile 40), damit Build-Fehler früh sichtbar sind

**DoD:**

- CI-Datei enthält `npm run build` Step
- Build läuft vor Server-Tests
- CI schlägt bei Build-Error fehl

---

## Abschluss-Checks (manuell)

Nach Implementierung prüfen:

1. `grep -R "animate-pulse" src/` → keine Treffer in Teaser/Locked-Pages
2. `grep -R "framer-motion" src/components/home` → keine Treffer
3. Manuell testen:

                        - `/` zeigt minimalen Hero (Logo, Text, 3 Icons)
                        - `/game`, `/forge`, `/badges` komplett non-interactive (keine Navbar, keine CTAs)
                        - `/feed` erre