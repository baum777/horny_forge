# Gamification

Die Gamification-Schicht wird sowohl im Frontend als auch im Backend gehandhabt:

- Client-seitig gibt es Helper und Hooks (`lib/gamification.ts`, `hooks/useGamification.ts`, `components/gamification/`) zur Darstellung von Fortschritt, Badges und Ereignissen.
- Server-seitig verarbeitet `server/src/gamification/engine.ts` Incentives, Validierung und Levels, während `server/src/badges` die Badge-Definitionen zur Laufzeit bereitstellt.
- `server/src/controllers` und `services` orchestrieren Gamification-Endpunkte, die das Frontend über `/api/gamification` konsumiert und für Benutzeraktionen wie das Erstellen neuer Assets oder das Einlösen von Badges nutzt.

