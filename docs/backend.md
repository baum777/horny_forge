# Backend

Die Express-Anwendung lebt unter `server/` und nutzt TypeScript, `tsx` im Dev-Modus und ein klassisches `tsc`-Build für Production. Die API-Routes hängen unter `/api` (z. B. `ForgeController`, Gamification-Controller) und der Server lauscht standardmäßig auf Port 3001 (konfigurierbar via `server/src/config.ts` und `PORT`).

Umwelt-Informationen (Supabase-Credentials, OpenAI-Schlüssel, `BASE_IMAGES_PATH`, Rate-Limits) kommen aus `.env` und laufen über `dotenv`. Tests werden über `vitest` (`server/vitest.config.ts`) gesteuert, wobei sowohl `server/src/test/**` als auch die Legacy-Tests in `server/test` ausgeführt werden können.

Die Prompt-Pipeline lebt in `server/src/services/PromptEngine.ts`: dort werden Eingaben normalisiert, verbotene Begriffe ersetzt/entfernt und das finale DALL·E-Prompt mit Guardrails versehen. Assets (Base Images, statisches Material) dienen über `express.static` aus `server/public`, sodass das Backend selbst die Mediendateien hostet.

