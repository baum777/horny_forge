# Supabase SQL — Gamification Tables + RLS

## Tables

```sql
create table if not exists user_stats (
  user_id uuid primary key,
  xp_total int default 0,
  level int default 1,
  streak_days int default 0,
  last_active_at timestamptz,
  updated_at timestamptz default now()
);

create table if not exists badges (
  badge_id text primary key,
  name text,
  description text,
  visual_type text,
  rarity text
);

create table if not exists user_badges (
  user_id uuid,
  badge_id text,
  unlocked_at timestamptz default now(),
  primary key (user_id, badge_id)
);

create table if not exists user_daily_limits (
  user_id uuid not null,
  day date not null,
  xp_today int default 0,
  counters jsonb default '{}'::jsonb,
  updated_at timestamptz default now(),
  primary key (user_id, day)
);
```

## Recommended RLS Policies

```sql
alter table user_stats enable row level security;
alter table badges enable row level security;
alter table user_badges enable row level security;
alter table user_daily_limits enable row level security;

-- badges are public
create policy "badges_select_public" on badges
  for select using (true);

-- user stats: allow read as needed, writes via service role
create policy "user_stats_select" on user_stats
  for select using (true);

-- user badges: allow read as needed, writes via service role
create policy "user_badges_select" on user_badges
  for select using (true);

-- daily limits should remain service-role only
```

> Note: Writes for `user_stats`, `user_badges`, and `user_daily_limits` are expected to be handled server-side via the Supabase service role.
