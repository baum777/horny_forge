ALTER TABLE public.artifacts
  ADD COLUMN IF NOT EXISTS matrix_meta jsonb,
  ADD COLUMN IF NOT EXISTS scores jsonb,
  ADD COLUMN IF NOT EXISTS remix_of uuid REFERENCES public.artifacts(id),
  ADD COLUMN IF NOT EXISTS template_key text;

ALTER TABLE public.forge_previews
  ADD COLUMN IF NOT EXISTS matrix_meta jsonb,
  ADD COLUMN IF NOT EXISTS scores jsonb,
  ADD COLUMN IF NOT EXISTS template_key text;

CREATE TABLE IF NOT EXISTS public.meme_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  artifact_id uuid REFERENCES public.artifacts(id) ON DELETE SET NULL,
  user_id uuid,
  matrix_meta jsonb,
  scores jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.meme_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS artifacts_remix_of_idx ON public.artifacts (remix_of);
CREATE INDEX IF NOT EXISTS artifacts_template_key_idx ON public.artifacts (template_key);
CREATE INDEX IF NOT EXISTS meme_events_type_created_idx ON public.meme_events (event_type, created_at DESC);
