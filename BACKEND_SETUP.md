# HORNY META FORGE — Backend Setup Guide

## Übersicht

Das Backend für HORNY META FORGE ist ein Express.js-Server, der die Prompt-Engine und Bildgenerierung bereitstellt.

## Schnellstart

### 1. Backend-Server starten

```bash
cd server
npm install
cp .env.example .env
# Bearbeite .env und füge deine API-Keys ein
npm run dev
```

Der Server läuft auf `http://localhost:3001`.

### 2. Frontend starten

```bash
# Im Root-Verzeichnis
npm run dev
```

Das Frontend läuft auf `http://localhost:8080` und nutzt automatisch das Vite-Proxy für `/api/*` Requests.

## Environment Variables

Siehe `server/.env.example` für alle benötigten Variablen:

- `OPENAI_API_KEY` - OpenAI API Key für DALL·E
- `SUPABASE_URL` - Supabase Projekt-URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase Service Role Key (für Server-Only-Operationen)
- `PORT` - Backend-Port (Standard: 3001)

## Supabase Setup

### Storage Buckets erstellen

1. **`forge_previews`** (ephemeral)
   - Public read
   - Server-only write (Service Role Key)
   - Optional: TTL-Cleanup nach 1 Stunde

2. **`artifacts`** (permanent)
   - Public read
   - Authenticated write
   - Pfad: `artifacts/{userId}/{artifactId}.png`

### Database

Die `artifacts` Tabelle sollte bereits existieren (siehe `supabase/migrations/`).

Optional: `forge_generations` Tabelle für Preview-Tracking (nicht zwingend für MVP).

## Base Images

Die Base-Images müssen im `server/public/bases/` Verzeichnis liegen:

- `base-01-unicorn-head.png`
- `base-02-landscape.png`
- `base-03-jesus-meme.png`
- `base-04-rocket.png`

**Wichtig:** Diese Dateien müssen vorhanden sein, sonst schlägt die Bildgenerierung fehl.

## API Endpoints

### POST `/api/forge`

Generiert ein Preview-Bild.

**Auth:** Optional (anonyme Requests erlaubt, aber mit niedrigerem Rate Limit)

**Request:**
```json
{
  "base_id": "base-01",
  "preset": "HORNY_CORE_SKETCH",
  "user_input": "croisHorney bakery in space",
  "size": "1024x1024",
  "debug": false
}
```

**Response:**
```json
{
  "generation_id": "gen_...",
  "base_id": "base-01",
  "preset": "HORNY_CORE_SKETCH",
  "sanitized_input": "croisHorney bakery in space",
  "image_url": "https://...",
  "created_at": "2026-01-10T10:12:00Z",
  "meta": {
    "expires_in_seconds": 3600,
    "model": "dall-e-3",
    "size": "1024x1024"
  },
  "debug": {
    "final_prompt": "..."
  }
}
```

### POST `/api/forge/release`

Macht ein Preview-Bild permanent (Gallery).

**Auth:** Erforderlich (Bearer Token im Authorization Header)

**Request:**
```json
{
  "generation_id": "gen_...",
  "caption": "when the chart goes parabolic",
  "tags": ["#CroisHorney", "#SignalHorney"]
}
```

**Response:**
```json
{
  "artifact_id": "uuid",
  "image_url": "https://...",
  "redirect_url": "/archives/<artifact_id>"
}
```

## Rate Limiting

- **Anonym:** 3 Requests / 10 Minuten (pro IP + User-Agent)
- **Authentifiziert:** 12 Requests / 10 Minuten (pro User)
- **Release:** 20 / Tag pro User

Bei Überschreitung: HTTP 429 mit `Retry-After` Header.

## Tests

```bash
cd server
npm test
```

Führt die Prompt-Engine Tests aus (basierend auf der Spec).

## Production Deployment

1. Build:
```bash
cd server
npm run build
```

2. Start:
```bash
npm start
```

3. Environment Variables in Production setzen (z.B. via Vercel, Railway, etc.)

## Troubleshooting

### "OPENAI_API_KEY not configured"
→ Setze `OPENAI_API_KEY` in `.env`

### "Failed to load base image"
→ Stelle sicher, dass Base-Images im `server/public/bases/` Verzeichnis liegen

### "Preview storage failed"
→ Prüfe Supabase Storage Bucket `forge_previews` existiert und Service Role Key korrekt ist

### "Rate limit exceeded"
→ Warte oder authentifiziere dich für höheres Limit

## Architektur

- **PromptEngine**: Input-Sanitization + Guardrails + Prompt-Building
- **ImageGenAdapter**: OpenAI DALL·E Integration
- **StorageAdapter**: Supabase Storage für Previews + Artifacts
- **RateLimiter**: In-Memory Rate Limiting
- **ForgeController**: HTTP Endpoints + Validation

## Fehlercodes

- `INVALID_INPUT` - Ungültige Request-Parameter
- `UNAUTHORIZED` - Auth erforderlich
- `RATE_LIMIT` - Rate Limit überschritten
- `PROMPT_REJECTED` - Input enthält blockierte Inhalte
- `GEN_FAIL` - Bildgenerierung fehlgeschlagen
- `STORAGE_FAIL` - Storage-Fehler
- `DB_FAIL` - Datenbank-Fehler
- `NOT_FOUND` - Generation nicht gefunden/abgelaufen

