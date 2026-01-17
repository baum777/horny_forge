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

CREATE OR REPLACE FUNCTION public.rpc_claim_weekly_quest(
  p_week_id text,
  p_tier integer,
  p_user_id text,
  p_reward_amount integer,
  p_boost_amount integer,
  p_idempotency_key text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slots_remaining integer;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.weekly_quest_claims
    WHERE week_id = p_week_id AND tier = p_tier AND user_id = p_user_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'already_claimed');
  END IF;

  UPDATE public.weekly_quest_tiers
  SET slots_remaining = slots_remaining - 1,
      updated_at = now()
  WHERE week_id = p_week_id
    AND tier = p_tier
    AND slots_remaining > 0
  RETURNING slots_remaining INTO v_slots_remaining;

  IF v_slots_remaining IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'pool_empty');
  END IF;

  INSERT INTO public.weekly_quest_claims (
    week_id,
    tier,
    user_id,
    reward_amount,
    boost_amount
  ) VALUES (
    p_week_id,
    p_tier,
    p_user_id,
    p_reward_amount,
    p_boost_amount
  );

  INSERT INTO public.token_rewards (
    user_id,
    amount,
    status,
    week_id,
    tier,
    idempotency_key
  ) VALUES (
    p_user_id,
    p_reward_amount + p_boost_amount,
    'pending',
    p_week_id,
    p_tier,
    p_idempotency_key
  );

  RETURN json_build_object(
    'success', true,
    'slots_remaining', v_slots_remaining
  );
END;
$$;

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

