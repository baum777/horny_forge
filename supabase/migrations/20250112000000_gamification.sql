-- Gamification tables: user_stats, badges, user_badges

-- Create user_stats table
CREATE TABLE public.user_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp_total int DEFAULT 0 NOT NULL,
  level int DEFAULT 1 NOT NULL,
  streak_days int DEFAULT 0 NOT NULL,
  last_active_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create badges table
CREATE TABLE public.badges (
  badge_id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  visual_type text NOT NULL,
  rarity text NOT NULL
);

-- Create user_badges table
CREATE TABLE public.user_badges (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id text NOT NULL REFERENCES public.badges(badge_id) ON DELETE CASCADE,
  unlocked_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_stats
CREATE POLICY "Users can view their own stats"
  ON public.user_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view user stats (for leaderboards)"
  ON public.user_stats FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own stats"
  ON public.user_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS policies for badges
CREATE POLICY "Anyone can view badges"
  ON public.badges FOR SELECT
  USING (true);

-- RLS policies for user_badges
CREATE POLICY "Users can view their own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view user badges (for profiles)"
  ON public.user_badges FOR SELECT
  USING (true);

-- Insert badge definitions
INSERT INTO public.badges (badge_id, name, description, visual_type, rarity) VALUES
  ('SIGIL_FIRST_INFUSION', 'First Infusion', 'Created your first artifact', 'sigil', 'common'),
  ('SIGIL_FIRST_RELEASE', 'First Release', 'Released your first artifact to THE ARCHIVES', 'sigil', 'common'),
  ('SIGIL_FIRST_VOTE', 'First Vote', 'Cast your first vote', 'sigil', 'common'),
  ('STAMP_TREND_SPARK', 'Trend Spark', 'One of your artifacts reached 10 votes', 'stamp', 'rare'),
  ('STAMP_FEED_DOMINATOR', 'Feed Dominator', 'One of your artifacts reached 25 votes', 'stamp', 'epic'),
  ('FRAGMENT_RETURN_2D', '2-Day Streak', 'Returned for 2 consecutive days', 'fragment', 'common'),
  ('FRAGMENT_RETURN_7D', '7-Day Streak', 'Returned for 7 consecutive days', 'fragment', 'rare'),
  ('OBJECT_CROISHORNEY', 'Croishorney', 'Used the croishorney tag 3 times', 'object', 'common'),
  ('OBJECT_EICHHORNEY', 'Eichhorny', 'Used the eichhorny tag 3 times', 'object', 'common'),
  ('OBJECT_BRAINHORNEY', 'Brainhorny', 'Used the brainhorny tag 3 times', 'object', 'common'),
  ('STATE_X_LINKED', 'X Linked', 'Connected your X account', 'state', 'common')
ON CONFLICT (badge_id) DO NOTHING;

-- Function to create user_stats on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_stats (user_id, xp_total, level, streak_days, last_active_at)
  VALUES (NEW.id, 0, 1, 0, now())
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Grant STATE_X_LINKED badge if authenticated via X
  IF NEW.raw_user_meta_data->>'provider' = 'twitter' THEN
    INSERT INTO public.user_badges (user_id, badge_id)
    VALUES (NEW.id, 'STATE_X_LINKED')
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to create user_stats on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to trigger vote_received XP event
CREATE OR REPLACE FUNCTION public.handle_vote_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_id uuid;
BEGIN
  -- Get artifact author
  SELECT author_id INTO v_author_id
  FROM public.artifacts
  WHERE id = NEW.artifact_id;

  IF v_author_id IS NOT NULL AND v_author_id != NEW.user_id THEN
    -- Trigger vote_received event for the author
    -- This will be handled by the /api/event endpoint via a webhook or direct call
    -- For now, we'll use a simpler approach: update user_stats directly
    -- In production, you might want to use pg_net or similar to call the API
    
    -- Note: Direct XP update here is a simplified approach
    -- In production, you'd want to call the event processor
    PERFORM 1; -- Placeholder
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger for vote_received XP (simplified - will be handled client-side for MVP)
-- CREATE TRIGGER on_vote_received
--   AFTER INSERT ON public.votes
--   FOR EACH ROW
--   EXECUTE FUNCTION public.handle_vote_received();

-- Indexes for performance
CREATE INDEX idx_user_stats_level ON public.user_stats(level);
CREATE INDEX idx_user_stats_xp_total ON public.user_stats(xp_total DESC);
CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON public.user_badges(badge_id);

