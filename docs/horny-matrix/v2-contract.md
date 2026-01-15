# Horny Matrix v2 Contract (Short)

## Input
- `user_prompt` (string)
- Optional nudges:
  - `energy` (1..5)
  - `flavor` (enum)
  - `template_key` (string)
  - `remix_of` (uuid | null)
- Optional request id:
  - `preview_request_id` (string, client-supplied for retries)

## Output
- `matrix_meta`:
  - `intent`, `energy`, `flavor`, `pattern`
  - `context[]`
  - `rewrite_mode`
  - `template_key`
  - `schema_version`, `composer_version`
  - `used_guardrails[]`
  - `fallback_used`, `fallback_stage`, `energy_clamped`
- `scores`:
  - `risk`, `novelty`, `coherence` (0..1)
- `prompt_pack`:
  - `prompt`, `negative_prompt`
- `preview_request_id`:
  - echoed back if provided, or generated server-side for retry dedupe

## Guardrails
- SafetyRewrite must:
  - Metaphorize explicit terms.
  - Abstract or block real-person/PII content.
  - Enforce “no text in image” and high-contrast silhouette.

## Persistence
- `artifacts`: `matrix_meta`, `scores`, `remix_of`, `template_key`.
- `forge_previews`: `matrix_meta`, `scores`, `template_key`.
- `meme_events`: telemetry for generate/publish/vote/share/remix.
 - `matrix_events`: telemetry stream for matrix preview/release + guardrails.

## Telemetry
- Record `matrix_meta` + `scores` for:
  - performance-adaptive prompting
  - novelty unlocks
  - taste authority overlays
# HornyMatrix v2 Contract

## Overview

This document defines the contract for HornyMatrix v2, including backward compatibility guarantees and fallback mechanisms.

## Schema Version

All records with `matrix_meta` MUST include a `schema_version` field:
- `"v2"` - Current version with full HornyMatrix metadata
- `"legacy"` - Records created before HornyMatrix v2

## Legacy Records Handling

### Problem

Records created before HornyMatrix v2 implementation do not have `matrix_meta` fields. The system must handle these gracefully without breaking API contracts.

### Solution

**Server-Side Read-Fallback (API Layer)**

When reading a Meme/Artifact record:

```typescript
import { normalizeMatrixMeta } from '@/services/hornyMatrix/LegacyRecordsHandler';

const matrixMeta = normalizeMatrixMeta(record.matrix_meta);
```

This function:
- Returns the existing `matrix_meta` if present and valid
- Returns explicit legacy defaults if `matrix_meta` is missing or invalid
- Ensures `matrix_meta` is never `null` or `undefined`

### Legacy Defaults

```typescript
{
  schema_version: "legacy",
  fallback_used: true,
  legacy_record: true,
  intent: "reaction",
  energy: 1,
  flavor: "ironic",
  pattern: "A",
  noveltyScore: 0.3,
  riskScore: 0.1,
  coherenceScore: 0.5,
  used_guardrails: ["LEGACY_RECORD_DEFAULT"]
}
```

### API Behavior

- **Reading**: Legacy records return normalized `matrix_meta` with `legacy_record: true`
- **Writing**: New records MUST include `matrix_meta` with `schema_version: "v2"`
- **Filtering**: Queries can filter by `matrix_meta.legacy_record` to distinguish old/new records
 - **Scores**: Legacy records provide default `scores` with `novelty/coherence/risk = null`

## Composer Fallback Contract

### Problem

`MemePromptComposer.compose()` must never fail without producing a prompt with Brand Directives.

### Solution

**Orchestrator-Level Guard**

```typescript
import { compose, composeFallback } from '@/services/hornyMatrix/MemePromptComposer';

let composed;
let composerFallbackUsed = false;

try {
  composed = compose({
    rewritten_prompt: userPrompt,
    selection: matrixSelection,
  });
} catch (err) {
  composerFallbackUsed = true;
  composed = composeFallback({
    rewritten_prompt: userPrompt,
    selection: {
      energy: 1,
      pattern: 'A',
      // ... safe defaults
    },
  });
}
```

### Fallback Requirements

`composeFallback()` MUST:
- Always include Brand Directives:
  - `bold silhouette`
  - `high contrast`
  - `readable at 32px`
  - `no text / no letters / no logos`
  - `symbolic over literal`
- Never throw an error
- Include `matrix_meta` with:
  ```typescript
  {
    fallback_used: true,
    fallback_stage: "composer",
    used_guardrails: ["COMPOSER_FALLBACK"]
  }
  ```

### Telemetry

When fallback is used, emit:
```typescript
emitTelemetryEvent('matrix_fallback_used', {
  stage: 'composer',
  requestId: generationId,
}, generationId);
```

## Telemetry Deduplication

### Problem

Preview retries (UI, network issues, user spam) cause event storms with `matrix_preview_created` events.

### Solution

**Request-Scoped De-Dup**

```typescript
import { emitTelemetryEvent } from '@/services/hornyMatrix/TelemetryService';

// Only first event per request_id is emitted
emitTelemetryEvent('matrix_preview_created', {
  meme_preview_id: previewResult.generationId,
  preview_request_id,
  schema_version,
  axes,
  scores,
  flags,
}, preview_request_id);
```

### Behavior

- First event per `requestId` + `event` combination: **Emitted**
- Duplicate events: **Skipped** (logged as debug)
- Cleanup: Request tracking cleared after 5 minutes

## Brand Directives Enforcement

### Critical Rule

**No prompt may be generated without Brand Directives.**

Brand Directives MUST be present in:
- Normal prompts (via `compose()`)
- Fallback prompts (via `composeFallback()`)
- Legacy prompts (via normalization)

### Enforcement Points

1. **Composer Level**: `compose()` and `composeFallback()` always include directives
2. **Orchestrator Level**: Try-catch ensures fallback is used on any error
3. **API Level**: Validation rejects prompts without directives (future enhancement)

## Migration Path

### Phase 1: Fallback Implementation ✅
- Composer fallback implemented
- Legacy records handler implemented
- Telemetry deduplication implemented

### Phase 2: Integration (Pending)
- Integrate Composer into ForgeController
- Add telemetry events to preview generation
- Update API responses to include `matrix_meta`

### Phase 3: Full Migration (Future)
- Migrate all records to include `matrix_meta`
- Remove legacy fallback (optional)
- Add validation for Brand Directives

## Testing

### Composer Fallback
- ✅ `compose()` throws error → fallback used
- ✅ Fallback includes Brand Directives
- ✅ Fallback includes `matrix_meta.fallback_used`

### Legacy Records
- ✅ Record without `matrix_meta` → normalized defaults returned
- ✅ Record with invalid `matrix_meta` → normalized defaults returned
- ✅ Record with valid `matrix_meta` → original returned

### Telemetry Deduplication
- ✅ Same event + requestId → only first emitted
- ✅ Different requestId → both emitted
- ✅ Cleanup after timeout → tracking cleared
