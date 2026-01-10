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

-- Create storage bucket for artifacts
INSERT INTO storage.buckets (id, name, public)
VALUES ('artifacts', 'artifacts', true);

-- Storage policies
CREATE POLICY "Anyone can view artifact images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'artifacts');

CREATE POLICY "Authenticated users can upload artifact images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'artifacts' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own artifact images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'artifacts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own artifact images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'artifacts' AND auth.uid()::text = (storage.foldername(name))[1]);