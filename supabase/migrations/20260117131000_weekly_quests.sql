-- Weekly Quest tables: tier counters, claims, and token rewards

CREATE TABLE IF NOT EXISTS public.weekly_quest_tiers (
  week_id text NOT NULL,
  tier integer NOT NULL,
  slots_total integer NOT NULL,
  slots_remaining integer NOT NULL,
  pool_total integer NOT NULL,
  reward_per_claim integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (week_id, tier)
);

CREATE TABLE IF NOT EXISTS public.weekly_quest_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id text NOT NULL,
  tier integer NOT NULL,
  user_id text NOT NULL,
  reward_amount integer NOT NULL,
  boost_amount integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (week_id, tier, user_id)
);

CREATE TABLE IF NOT EXISTS public.token_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  amount integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  week_id text NOT NULL,
  tier integer NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.weekly_quest_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_quest_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read weekly quest tiers"
  ON public.weekly_quest_tiers FOR SELECT
  USING (true);

CREATE POLICY "User can read own quest claims"
  ON public.weekly_quest_claims FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "User can read own token rewards"
  ON public.token_rewards FOR SELECT
  USING (auth.uid() = user_id);

