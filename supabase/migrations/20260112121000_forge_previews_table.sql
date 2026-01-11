CREATE TABLE IF NOT EXISTS public.forge_previews (
  generation_id text PRIMARY KEY,
  user_id uuid NOT NULL,
  base_id text NOT NULL,
  preset text NOT NULL,
  moderation_status text DEFAULT 'review',
  moderation_reasons jsonb,
  brand_similarity double precision,
  base_match_id text,
  safety_checked_at timestamptz,
  created_at timestamptz DEFAULT now()
);
