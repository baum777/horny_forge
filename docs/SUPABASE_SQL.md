# Supabase SQL Schema

## Tables

```sql
-- Artifacts table
CREATE TABLE artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  caption TEXT NOT NULL,
  tags TEXT[] NOT NULL,
  author_id UUID NOT NULL,
  author_handle TEXT,
  author_avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  votes_count INT DEFAULT 0
);

-- Votes table
CREATE TABLE votes (
  artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (artifact_id, user_id)
);

-- Indexes
CREATE INDEX idx_artifacts_created_at ON artifacts(created_at DESC);
CREATE INDEX idx_artifacts_votes_count ON artifacts(votes_count DESC);
CREATE INDEX idx_artifacts_author_id ON artifacts(author_id);
CREATE INDEX idx_artifacts_tags ON artifacts USING GIN(tags);
CREATE INDEX idx_votes_artifact_id ON votes(artifact_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);
```

## RLS Policies

```sql
-- Enable RLS
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Artifacts: Public read, authenticated write
CREATE POLICY "Artifacts are viewable by everyone"
  ON artifacts FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own artifacts"
  ON artifacts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Votes: Authenticated users only
CREATE POLICY "Users can view votes"
  ON votes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own votes"
  ON votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON votes FOR DELETE
  USING (auth.uid() = user_id);
```

## Storage Buckets

```sql
-- Create buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('artifacts', 'artifacts', true),
  ('forge_previews', 'forge_previews', true);

-- Storage policies for artifacts bucket
CREATE POLICY "Artifacts are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'artifacts');

CREATE POLICY "Authenticated users can upload artifacts"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'artifacts' AND auth.role() = 'authenticated');

-- Storage policies for forge_previews bucket
CREATE POLICY "Forge previews are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'forge_previews');

CREATE POLICY "Server can upload forge previews"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'forge_previews');
```

## RPC Functions

```sql
-- Vote function
CREATE OR REPLACE FUNCTION rpc_vote(p_artifact_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_votes_count INT;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'votes_count', 0, 'error', 'Not authenticated');
  END IF;

  -- Insert vote (ignore if already exists)
  INSERT INTO votes (artifact_id, user_id)
  VALUES (p_artifact_id, v_user_id)
  ON CONFLICT (artifact_id, user_id) DO NOTHING;

  -- Update votes_count
  UPDATE artifacts
  SET votes_count = (
    SELECT COUNT(*) FROM votes WHERE artifact_id = p_artifact_id
  )
  WHERE id = p_artifact_id
  RETURNING votes_count INTO v_votes_count;

  RETURN json_build_object('success', true, 'votes_count', v_votes_count, 'error', NULL);
END;
$$;

-- Unvote function
CREATE OR REPLACE FUNCTION rpc_unvote(p_artifact_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_votes_count INT;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'votes_count', 0, 'error', 'Not authenticated');
  END IF;

  -- Delete vote
  DELETE FROM votes
  WHERE artifact_id = p_artifact_id AND user_id = v_user_id;

  -- Update votes_count
  UPDATE artifacts
  SET votes_count = (
    SELECT COUNT(*) FROM votes WHERE artifact_id = p_artifact_id
  )
  WHERE id = p_artifact_id
  RETURNING votes_count INTO v_votes_count;

  RETURN json_build_object('success', true, 'votes_count', v_votes_count, 'error', NULL);
END;
$$;
```

