-- Create artifacts table
CREATE TABLE public.artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  caption text NOT NULL,
  tags text[] NOT NULL,
  author_id uuid NOT NULL,
  author_handle text,
  author_avatar text,
  created_at timestamptz DEFAULT now(),
  votes_count int DEFAULT 0
);

-- Create votes table
CREATE TABLE public.votes (
  artifact_id uuid REFERENCES public.artifacts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (artifact_id, user_id)
);

-- Enable RLS on both tables
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- RLS policies for artifacts
CREATE POLICY "Anyone can view artifacts"
  ON public.artifacts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert their own artifacts"
  ON public.artifacts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own artifacts"
  ON public.artifacts FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own artifacts"
  ON public.artifacts FOR DELETE
  USING (auth.uid() = author_id);

-- RLS policies for votes
CREATE POLICY "Anyone can view votes"
  ON public.votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert their own votes"
  ON public.votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON public.votes FOR DELETE
  USING (auth.uid() = user_id);

-- Function to increment votes_count
CREATE OR REPLACE FUNCTION public.increment_votes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.artifacts
  SET votes_count = votes_count + 1
  WHERE id = NEW.artifact_id;
  RETURN NEW;
END;
$$;

-- Function to decrement votes_count
CREATE OR REPLACE FUNCTION public.decrement_votes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.artifacts
  SET votes_count = GREATEST(votes_count - 1, 0)
  WHERE id = OLD.artifact_id;
  RETURN OLD;
END;
$$;

-- Trigger for insert votes
CREATE TRIGGER on_vote_insert
  AFTER INSERT ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_votes_count();

-- Trigger for delete votes
CREATE TRIGGER on_vote_delete
  AFTER DELETE ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_votes_count();

-- Voting atomicity (RPC) — client should call these for toggle + count
CREATE OR REPLACE FUNCTION public.rpc_vote(p_artifact_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_votes_count int;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'votes_count', 0, 'error', 'Not authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.artifacts a WHERE a.id = p_artifact_id) THEN
    RETURN json_build_object('success', false, 'votes_count', 0, 'error', 'Artifact not found');
  END IF;

  INSERT INTO public.votes (artifact_id, user_id)
  VALUES (p_artifact_id, v_user_id)
  ON CONFLICT DO NOTHING;

  SELECT a.votes_count INTO v_votes_count
  FROM public.artifacts a
  WHERE a.id = p_artifact_id;

  RETURN json_build_object('success', true, 'votes_count', COALESCE(v_votes_count, 0), 'error', NULL);
EXCEPTION
  WHEN OTHERS THEN
    SELECT a.votes_count INTO v_votes_count
    FROM public.artifacts a
    WHERE a.id = p_artifact_id;
    RETURN json_build_object('success', false, 'votes_count', COALESCE(v_votes_count, 0), 'error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_unvote(p_artifact_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_votes_count int;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'votes_count', 0, 'error', 'Not authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.artifacts a WHERE a.id = p_artifact_id) THEN
    RETURN json_build_object('success', false, 'votes_count', 0, 'error', 'Artifact not found');
  END IF;

  DELETE FROM public.votes
  WHERE artifact_id = p_artifact_id
    AND user_id = v_user_id;

  SELECT a.votes_count INTO v_votes_count
  FROM public.artifacts a
  WHERE a.id = p_artifact_id;

  RETURN json_build_object('success', true, 'votes_count', COALESCE(v_votes_count, 0), 'error', NULL);
EXCEPTION
  WHEN OTHERS THEN
    SELECT a.votes_count INTO v_votes_count
    FROM public.artifacts a
    WHERE a.id = p_artifact_id;
    RETURN json_build_object('success', false, 'votes_count', COALESCE(v_votes_count, 0), 'error', SQLERRM);
END;
$$;

-- Create storage bucket for artifacts
INSERT INTO storage.buckets (id, name, public)
VALUES ('artifacts', 'artifacts', true)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    public = EXCLUDED.public;

-- Storage policies
CREATE POLICY "Anyone can view artifact images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'artifacts');

CREATE POLICY "Authenticated users can upload artifact images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'artifacts'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'artifacts'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Users can update their own artifact images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'artifacts'
    AND (storage.foldername(name))[1] = 'artifacts'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

CREATE POLICY "Users can delete their own artifact images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'artifacts'
    AND (storage.foldername(name))[1] = 'artifacts'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );