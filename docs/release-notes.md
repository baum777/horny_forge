# Release Notes

## Blueprint Refactoring
- Theme runtime introduced (resolver, provider, config endpoint).
- UI copy and branding moved into theme packs.
- Asset paths routed through theme assets.
- Guardrails added to prevent hardcoded brand terms and direct asset imports.
- Documentation normalized to domain-neutral terminology.

## Verification
- `node scripts/theme-guard.mjs`
- `node -e "JSON.parse(require('fs').readFileSync('themes/default/copy.de.json','utf-8'))"`


