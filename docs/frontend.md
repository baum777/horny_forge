# Frontend

Die Root-Applikation ist eine Vite/React-SPA mit Tailwind und Shadcn-UI-Komponenten. Der Dev-Server läuft auf Port 8080, ist über `npm run dev` startbar und rendered die gesamte UI im `src/`-Ordner. `public/` enthält Client-Assets (Favicons, Badge-Icons, result.jsonl) und wird von Vite direkt ausgeliefert.

Die SPA nutzt Proxy-Weiterleitungen für `/api`, `/health` und `/horny_base`, damit der Client nahtlos mit dem Express-Backend kommunizieren kann, ohne CORS-Header manuell zu steuern. Dynamische Inhalte kommen über Hooks (z. B. `useArtifacts`, `useGamification`) und Lib-Funktionen (`lib/api.ts`, `lib/storage.ts`) herein.

