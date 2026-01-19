# Blueprint Template

## Projektübersicht
**Blueprint Template (kurz, sachlich)**: Eine Vite/React-Front-End-Experience, die mit einem Express-Backend zusammenarbeitet, um themenfähige UI-Flows, Generator-Logik und Gamification-Metadaten zu orchestrieren.
**Zweck der Plattform**: Nutzer:innen können textliche Konzepte in generative Assets verwandeln; die visuelle Darstellung wird über Theme-Packs (Tokens, Copy, Assets) zur Laufzeit angepasst.

## Architecture at a Glance
### Frontend (Vite SPA)
Die SPA lebt im Repo-Root, nutzt Vite + React + Tailwind und läuft auf Port 8080. Sie greift auf REST-Endpunkte (`/api/*`) sowie auf Theme-Ressourcen (`/themes/*`) über die Proxy-Einstellungen des Dev-Servers zu.
### Backend (Express, /server)
Der Express-Server entwickelt sich unter `server/` mit TypeScript, `tsx` für Dev und einem `tsc`-Build für Produktion. API-Routen sind unter `/api` gebündelt (z. B. Generator/Gamification), die gesamte Logik läuft auf Port 3001.
### Supabase (DB + Storage)
Supabase kommt über `@supabase/supabase-js` zum Einsatz, die Verbindungskonfiguration lebt im `supabase/`-Ordner (Migrations + config) und wird auf der Backend-Seite über `server/src/api` genutzt.

## Backend – Current Setup
- **Port (3001)**: Standard-Value, durch `PORT` über `server/src/config.ts` konfigurierbar.
- **Express API**: Container-ized unter `server/src/routes/` und angeschlossene Controller/Services wie `ForgeController`.
- **Test-Setup (vitest)**: `server/vitest.config.ts` orientiert sich an `server/src/test/**` und `server/test` für Smoke-Checks; `npm test` startet das Vitest-Setup.
- **PromptEngine (Sanitization & Safety-Checks)**: `server/src/services/PromptEngine.ts` deckt Input-Normalisierung, Keyword-/Personen-Filters und Guardrails für DALL·E ab.
- **Assets & Static Files**: Express serviert `server/public` statisch, Base-Images liegen unter dem in `BASE_IMAGES_PATH` konfigurierten Pfad. Theme-Packs werden aus `themes/` geladen und über `/themes/*` ausgeliefert.

## Local Development
- **Ports (8080 / 3001)**: Frontend-Devserver auf 8080, Backend auf 3001; beide müssen parallel laufen.
- **Proxy-Routen**: Vite leitet `/api`, `/health` und `/themes` an `http://localhost:3001` weiter, damit die SPA nicht auf CORS-Header angewiesen ist.
- **Start-Kommandos**: `npm run dev` im Projekt-Root startet Vite, `cd server && npm run dev` startet die Express-App (achte darauf, dass der Code `process.cwd()` erwartet, also von der Repo-Wurzel oder einem konsistenten Pfad gestartet wird).

## Known Pitfalls
- **Bilder laden nicht** → Meist ein Pfad/Proxy/Static-Serving-Problem (CWD-Abhängigkeit, wenn der Server nicht vom Repo-Root startet).
- **Tests failen** → Oft Policy/Test-Mismatch, nicht ein fehlendes ENV-Flag; die Vitest-Konfiguration deckt `server/src/test` ab, weitere Tests liegen in `server/test`.

For a detailed and factual description of the current architecture, see:
docs/architecture_current_state.md

## AI / Agent Rules
The following files in the repository root govern AI behavior and task workflows:
- `.cursorrules`: Core instructions for the Cursor AI agent.
- `TASK_CONTRACT.template.md`: Template for defining complex tasks.
- `CURSOR_AGENT_PLAYBOOK.md`: Detailed playbook for agent operations and best practices.