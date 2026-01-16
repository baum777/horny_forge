CREATE TABLE IF NOT EXISTS public.matrix_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  meme_id uuid,
  user_id uuid,
  schema_version text,
  axes jsonb,
  scores jsonb,
  flags jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.matrix_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS matrix_events_type_created_idx ON public.matrix_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS matrix_events_meme_id_idx ON public.matrix_events (meme_id);
