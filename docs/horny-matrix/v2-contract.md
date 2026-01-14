# Horny Matrix v2 Contract (Short)

## Input
- `user_prompt` (string)
- Optional nudges:
  - `energy` (1..5)
  - `flavor` (enum)
  - `template_key` (string)
  - `remix_of` (uuid | null)

## Output
- `matrix_meta`:
  - `intent`, `energy`, `flavor`, `pattern`
  - `context[]`
  - `rewrite_mode`
  - `template_key`
  - `schema_version`, `composer_version`
  - `used_guardrails[]`
  - `fallback_used`, `energy_clamped`
- `scores`:
  - `risk`, `novelty`, `coherence` (0..1)
- `prompt_pack`:
  - `prompt`, `negative_prompt`

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
