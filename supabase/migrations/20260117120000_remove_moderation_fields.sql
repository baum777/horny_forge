ALTER TABLE public.forge_previews
  DROP COLUMN IF EXISTS moderation_status,
  DROP COLUMN IF EXISTS moderation_reasons;

ALTER TABLE public.artifacts
  DROP COLUMN IF EXISTS moderation_status,
  DROP COLUMN IF EXISTS moderation_reasons;

