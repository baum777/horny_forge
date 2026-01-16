# Meme Generator Path Map

## Root-Level Snapshot
- `server/` → Express backend (API + prompt pipeline + storage). 
- `src/` → React/Vite SPA (Meta Forge UI + archives/voting). 
- `public/` → Frontend static assets (SPA public). 
- `supabase/` → DB migrations + schema changes. 
- `package.json` → project scripts + dependencies. 
- `vite.config.ts` → Vite dev proxy for `/api` + `/horny_base`.

## Path Finder (key files)
| Path | Description |
| --- | --- |
| `src/components/MetaForge/MetaForge.tsx` | Main Meme Forge UI container (state, forge/release/share). |
| `src/components/MetaForge/BasePicker.tsx` | Fetches `/api/meme-pool` and selects base template. |
| `src/components/MetaForge/ForgeForm.tsx` | User input (keywords/caption/tags). |
| `src/components/MetaForge/ForgePreview.tsx` | Preview image + release/share UI. |
| `src/lib/api/forge.ts` | Frontend client for `/api/forge` + `/api/forge/release`. |
| `src/hooks/useVote.ts` | Vote RPC + gamification events. |
| `server/src/app.ts` | Express app wiring `/api/forge`, `/api/meme-pool`, gamification, etc. |
| `server/src/controllers/ForgeController.ts` | Forge generation + release orchestration. |
| `server/src/services/PromptEngine.ts` | Current prompt sanitize + prompt build (legacy). |
| `server/src/services/ImageGenAdapter.ts` | OpenAI DALL·E generation adapter. |
| `server/src/services/StorageAdapter.ts` | Supabase Storage preview + release. |
| `server/src/services/ModerationService.ts` | OpenAI moderation checks. |
| `server/src/services/SimilarityService.ts` | Base-image similarity check. |
| `server/src/routes/memePool.ts` | Returns base templates from `server/public/horny_base`. |
| `server/public/horny_base/*` | Base meme template images. |
| `supabase/migrations/20260110112710_610ed6e7-069d-45f4-b153-ba23e9136b34.sql` | `artifacts` + `votes` schema + RPC. |
| `supabase/migrations/20260112121000_forge_previews_table.sql` | `forge_previews` table for preview safety checks. |
| `supabase/migrations/20260113000000_gamification_tables.sql` | Gamification tables + award_event RPC. |
| `docs/backend.md` | Backend overview + prompt pipeline notes. |
| `docs/assets.md` | Base image serving via `/horny_base`. |
| `vite.config.ts` | Proxy for `/api` + `/horny_base` to backend. |
