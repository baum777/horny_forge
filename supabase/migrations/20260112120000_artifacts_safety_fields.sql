ALTER TABLE public.artifacts
  ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'review',
  ADD COLUMN IF NOT EXISTS moderation_reasons jsonb,
  ADD COLUMN IF NOT EXISTS brand_similarity double precision,
  ADD COLUMN IF NOT EXISTS base_match_id text,
  ADD COLUMN IF NOT EXISTS safety_checked_at timestamptz;
