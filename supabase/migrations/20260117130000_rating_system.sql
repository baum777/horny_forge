-- Rating system for artifacts (1-5 stars) + aggregates on artifacts

CREATE TABLE IF NOT EXISTS public.meme_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id uuid NOT NULL REFERENCES public.artifacts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS meme_ratings_unique_user_artifact
  ON public.meme_ratings (artifact_id, user_id);

CREATE INDEX IF NOT EXISTS meme_ratings_artifact_id_idx
  ON public.meme_ratings (artifact_id);

ALTER TABLE public.meme_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view meme ratings"
  ON public.meme_ratings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can rate"
  ON public.meme_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rating"
  ON public.meme_ratings FOR UPDATE
  USING (auth.uid() = user_id);

ALTER TABLE public.artifacts
  ADD COLUMN IF NOT EXISTS avg_rating double precision,
  ADD COLUMN IF NOT EXISTS rating_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS report_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hidden boolean DEFAULT false;

CREATE OR REPLACE FUNCTION public.refresh_artifact_rating_stats(p_artifact_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
  v_avg double precision;
BEGIN
  SELECT COUNT(*), AVG(rating)
    INTO v_count, v_avg
  FROM public.meme_ratings
  WHERE artifact_id = p_artifact_id;

  UPDATE public.artifacts
  SET rating_count = COALESCE(v_count, 0),
      avg_rating = v_avg
  WHERE id = p_artifact_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.on_meme_rating_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_artifact_rating_stats(COALESCE(NEW.artifact_id, OLD.artifact_id));
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS meme_ratings_after_insert ON public.meme_ratings;
CREATE TRIGGER meme_ratings_after_insert
  AFTER INSERT ON public.meme_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.on_meme_rating_change();

DROP TRIGGER IF EXISTS meme_ratings_after_update ON public.meme_ratings;
CREATE TRIGGER meme_ratings_after_update
  AFTER UPDATE ON public.meme_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.on_meme_rating_change();

DROP TRIGGER IF EXISTS meme_ratings_after_delete ON public.meme_ratings;
CREATE TRIGGER meme_ratings_after_delete
  AFTER DELETE ON public.meme_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.on_meme_rating_change();

