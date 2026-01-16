# Meme Generator Current State

## Summary
The current meme generator is implemented as the “Meta Forge” feature in the React SPA and backed by an Express API. Users select a base image template, select a preset, enter keywords, and call `/api/forge` to generate a preview. A second call to `/api/forge/release` persists the final artifact, saves it to Supabase Storage, and publishes it into the `artifacts` table for the Archives feed.

## Frontend Overview
- Meta Forge lives under `src/components/MetaForge/*` and is rendered on the Interact page. 
- Base templates are fetched from `/api/meme-pool`. 
- Forge requests are sent via `src/lib/api/forge.ts`.
- Voting and XP are handled via `useVote` and `postGamificationEvent`.

## Backend Overview
- `/api/forge` and `/api/forge/release` are handled by `ForgeController`. 
- Prompting uses `PromptEngine` (sanitize + guardrail prompt). 
- Image generation uses `ImageGenAdapter` (OpenAI DALL·E 3). 
- Storage uses `StorageAdapter` (Supabase Storage buckets).
- Moderation uses OpenAI moderation API.
- Brand similarity check uses perceptual hashing via `SimilarityService`.

## Storage & DB
- Previews are stored in `forge_previews` bucket + `forge_previews` table for safety metadata.
- Released artifacts are stored in `artifacts` bucket + `artifacts` table for feed/publishing.
- Voting uses `votes` table + RPC `rpc_vote` and `rpc_unvote`.
- Gamification uses `award_event` RPC and stats tables.
