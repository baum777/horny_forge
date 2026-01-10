# HORNY META FORGE — Backend

Backend-API für die HORNY META FORGE Prompt-Engine und Bildgenerierung.

## Setup

### 1. Dependencies installieren

```bash
cd server
npm install
```

### 2. Environment Variables

Erstelle eine `.env` Datei im `server/` Verzeichnis:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Server
PORT=3001
NODE_ENV=development

# Forge Config
PREVIEW_TTL_SECONDS=3600
FORGE_RATE_LIMIT_ANONYMOUS=3
FORGE_RATE_LIMIT_AUTHENTICATED=12
FORGE_RATE_LIMIT_WINDOW_MS=600000
RELEASE_RATE_LIMIT_PER_DAY=20

# Base Images Path (relative to server root)
BASE_IMAGES_PATH=./public/bases
```

### 3. Base Images Setup

Die Base-Images müssen im `public/bases/` Verzeichnis liegen:

```
server/
  public/
    bases/
      base-01-unicorn-head.png
      base-02-landscape.png
      base-03-jesus-meme.png
      base-04-rocket.png
```

**Wichtig:** Die Base-Images müssen vorhanden sein, sonst schlägt die Bildgenerierung fehl.

### 4. Supabase Storage Buckets

Erstelle zwei Storage Buckets in Supabase:

1. **`forge_previews`** (ephemeral)
   - Public read
   - Server-only write (Service Role Key)
   - TTL: 1 Stunde (optional cleanup)

2. **`artifacts`** (permanent)
   - Public read
   - Authenticated write
   - Pfad: `artifacts/{userId}/{artifactId}.png`

### 5. Development Server starten

```bash
npm run dev
```

Der Server läuft auf `http://localhost:3001`.

## API Endpoints

### POST `/api/forge`

Generiert ein Preview-Bild mit AI.

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
  }
}
```

### POST `/api/forge/release`

Macht ein Preview-Bild permanent (Gallery).

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

## Tests

```bash
npm test
```

Führt die Prompt-Engine Tests aus (basierend auf der Spec).

## Production Build

```bash
npm run build
npm start
```

## Architektur

- **PromptEngine**: Input-Sanitization + Guardrails + Prompt-Building
- **ImageGenAdapter**: OpenAI DALL·E Integration
- **StorageAdapter**: Supabase Storage für Previews + Artifacts
- **RateLimiter**: In-Memory Rate Limiting (IP/User-basiert)
- **ForgeController**: HTTP Endpoints + Validation

## Fehlercodes

- `INVALID_INPUT`: Ungültige Request-Parameter
- `UNAUTHORIZED`: Auth erforderlich
- `RATE_LIMIT`: Rate Limit überschritten
- `PROMPT_REJECTED`: Input enthält blockierte Inhalte
- `GEN_FAIL`: Bildgenerierung fehlgeschlagen
- `STORAGE_FAIL`: Storage-Fehler
- `DB_FAIL`: Datenbank-Fehler
- `NOT_FOUND`: Generation nicht gefunden/abgelaufen

