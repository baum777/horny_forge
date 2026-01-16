# Meme Generator Flow (UI → API → Service → Storage)

## Frontend Flow
1. User opens Meta Forge (`Interact` page) and selects a base image from `/api/meme-pool`.
2. User selects a preset and enters keywords + caption + tags.
3. UI calls `forgeArtifact()` → `POST /api/forge`.
4. UI shows a preview image + metadata (generation id, preset/base).
5. User clicks “Release Artifact” → `POST /api/forge/release`.
6. UI receives `artifact_id` and navigates to Archives detail page.

## API/Backend Flow
### `POST /api/forge`
- **Input**: `{ base_id/base_image, preset, user_input, size }`
- **Steps**:
  - validate + enforce daily quota
  - build prompt (PromptEngine)
  - moderation check
  - generate image (OpenAI DALL·E)
  - store preview in Supabase Storage (`forge_previews` bucket)
  - store safety metadata in `forge_previews` table
- **Output**: `{ generation_id, image_url, preset, base_id, meta, debug? }`

### `POST /api/forge/release`
- **Input**: `{ generation_id, caption, tags }`
- **Steps**:
  - enforce daily quota
  - download preview bytes
  - re-check moderation status
  - compute brand similarity
  - store artifact in Supabase Storage (`artifacts` bucket)
  - insert into `artifacts` table
- **Output**: `{ artifact_id, image_url, redirect_url }`

## Storage Flow
- `forge_previews` bucket → ephemeral images for preview.
- `artifacts` bucket → permanent artifacts for Archives.
