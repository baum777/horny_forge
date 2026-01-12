-- Gamification System Tables
-- Production-ready schema with idempotency, event ledger, and payout queue

-- 1) user_stats: Single source of truth for user gamification state
CREATE TABLE IF NOT EXISTS user_stats (
  user_id TEXT PRIMARY KEY,
  
  -- Level & Progress
  level INTEGER NOT NULL DEFAULT 1,
  lifetime_horny_earned INTEGER NOT NULL DEFAULT 0,
  daily_horny_earned INTEGER NOT NULL DEFAULT 0,
  weekly_horny_earned INTEGER NOT NULL DEFAULT 0,
  
  -- Streak & Activity
  current_streak INTEGER NOT NULL DEFAULT 0,
  last_active_at TIMESTAMPTZ,
  
  -- Quiz Results
  quiz_class TEXT,
  degen INTEGER,
  horny INTEGER,
  conviction INTEGER,
  
  -- Aggregated Counts (JSONB for flexibility)
  counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_votes_received INTEGER NOT NULL DEFAULT 0,
  total_time_seconds INTEGER NOT NULL DEFAULT 0,
  
  -- Unlocks
  unlocked_badges TEXT[] NOT NULL DEFAULT '{}',
  unlocked_features TEXT[] NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_stats_level ON user_stats(level);
CREATE INDEX idx_user_stats_last_active ON user_stats(last_active_at);

-- 2) gamification_events: Append-only ledger for auditability
CREATE TABLE IF NOT EXISTS gamification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES user_stats(user_id) ON DELETE CASCADE,
  
  -- Action Details
  action TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Result
  delta_horny INTEGER NOT NULL DEFAULT 0,
  level_before INTEGER NOT NULL,
  level_after INTEGER NOT NULL,
  
  -- Caps Applied
  caps_applied JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Unlocks
  badges_unlocked TEXT[] NOT NULL DEFAULT '{}',
  features_unlocked TEXT[] NOT NULL DEFAULT '{}',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'rejected')),
  reject_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gamification_events_user_id ON gamification_events(user_id);
CREATE INDEX idx_gamification_events_action ON gamification_events(action);
CREATE INDEX idx_gamification_events_created_at ON gamification_events(created_at DESC);
CREATE INDEX idx_gamification_events_status ON gamification_events(status);

-- 3) idempotency_keys: Prevent duplicate processing
CREATE TABLE IF NOT EXISTS idempotency_keys (
  user_id TEXT NOT NULL,
  idem_key TEXT NOT NULL,
  action TEXT NOT NULL,
  event_id UUID REFERENCES gamification_events(id) ON DELETE SET NULL,
  response_cache JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  PRIMARY KEY (user_id, idem_key)
);

CREATE INDEX idx_idempotency_keys_user_id ON idempotency_keys(user_id);
CREATE INDEX idx_idempotency_keys_created_at ON idempotency_keys(created_at DESC);

-- 4) payout_jobs: Off-chain pending balance -> future on-chain claim
CREATE TABLE IF NOT EXISTS payout_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES user_stats(user_id) ON DELETE CASCADE,
  
  -- Amount & Status
  amount INTEGER NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  
  -- Idempotency & Event Link
  idempotency_key TEXT NOT NULL UNIQUE,
  event_id UUID REFERENCES gamification_events(id) ON DELETE SET NULL,
  
  -- Retry Logic
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  
  -- On-chain (future)
  tx_signature TEXT,
  wallet_address TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payout_jobs_user_id ON payout_jobs(user_id);
CREATE INDEX idx_payout_jobs_status ON payout_jobs(status);
CREATE INDEX idx_payout_jobs_idempotency_key ON payout_jobs(idempotency_key);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON user_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payout_jobs_updated_at
  BEFORE UPDATE ON payout_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Helper function: Reset daily caps (call via cron or scheduled job)
CREATE OR REPLACE FUNCTION reset_daily_caps()
RETURNS void AS $$
BEGIN
  UPDATE user_stats
  SET 
    daily_horny_earned = 0,
    counts = jsonb_set(
      counts,
      '{horny_daily_reset_at}',
      to_jsonb(EXTRACT(EPOCH FROM NOW())::bigint)
    )
  WHERE 
    -- Only reset if not already reset today
    (counts->>'horny_daily_reset_at')::bigint < EXTRACT(EPOCH FROM DATE_TRUNC('day', NOW()))::bigint
    OR counts->>'horny_daily_reset_at' IS NULL;
    
  -- Reset daily counters in counts JSONB
  UPDATE user_stats
  SET counts = (
    SELECT jsonb_object_agg(key, CASE WHEN key LIKE 'horny_daily_%' THEN 0 ELSE value END)
    FROM jsonb_each(counts)
  )
  WHERE counts ? 'horny_daily_reset_at';
END;
$$ LANGUAGE plpgsql;

-- Helper function: Reset weekly caps
CREATE OR REPLACE FUNCTION reset_weekly_caps()
RETURNS void AS $$
BEGIN
  UPDATE user_stats
  SET 
    weekly_horny_earned = 0,
    counts = jsonb_set(
      counts,
      '{horny_weekly_reset_at}',
      to_jsonb(EXTRACT(EPOCH FROM NOW())::bigint)
    )
  WHERE 
    (counts->>'horny_weekly_reset_at')::bigint < EXTRACT(EPOCH FROM DATE_TRUNC('week', NOW()))::bigint
    OR counts->>'horny_weekly_reset_at' IS NULL;
    
  UPDATE user_stats
  SET counts = (
    SELECT jsonb_object_agg(key, CASE WHEN key LIKE 'horny_weekly_%' THEN 0 ELSE value END)
    FROM jsonb_each(counts)
  )
  WHERE counts ? 'horny_weekly_reset_at';
END;
$$ LANGUAGE plpgsql;

