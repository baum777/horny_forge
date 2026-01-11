-- 1) Idempotency gate
create table if not exists public.processed_events (
  event_id uuid primary key,
  actor_user_id uuid not null,
  event_type text not null,
  subject_id text,
  source text,
  created_at timestamptz not null default now()
);

create index if not exists processed_events_actor_type_idx
  on public.processed_events(actor_user_id, event_type, created_at desc);

-- 2) User badges (if not present, keep schema consistent with app usage)
create table if not exists public.user_badges (
  user_id uuid not null,
  badge_id text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-- 3) Daily counters (optional, anti-farm)
create table if not exists public.user_daily_counters (
  user_id uuid not null,
  day date not null,
  key text not null,
  value int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, day, key)
);
