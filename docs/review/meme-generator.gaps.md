# Meme Generator Gaps (v2 Targets)

## Missing / Partial
- **Horny-Matrix guardrailing**: No structured intent/energy/flavor/pattern pipeline today.
- **Safety Rewrite**: Current PromptEngine removes blocked terms, but no rewrite mode (metaphorize/abstract/strict).
- **Post-processing text**: No built-in top/bottom text overlay editor or metadata.
- **Remix/Mutation**: No remix axis lock, no `remix_of` tracking.
- **Performance-adaptive prompting**: No telemetry feedback loop for prompt weighting.
- **Escalation mode**: When forge limits are hit, no “caption-only/remix-only” UX fallback.
- **Scoring**: No novelty/coherence/risk scores stored for analytics.
- **Telemetry**: No event stream for matrix intent + generation performance.
- **XP/Badges/Overlays link**: Gamification hooks exist but are not tied to matrix metadata or remixing.

## Required Changes
- Add matrix metadata + scores to DB (`artifacts`, `forge_previews`).
- Add telemetry event table + service.
- Extend API contracts to accept matrix nudges (energy, flavor, template).
- Add remix fields (`remix_of`) on publish.
- Implement Matrix Card UI in front-end (summary of intent/energy/flavor/scores).
