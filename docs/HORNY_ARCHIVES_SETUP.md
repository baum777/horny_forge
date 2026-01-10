# THE HORNY ARCHIVES — Supabase Setup Guide

## Overview

Dieses Projekt nutzt **Supabase ausschließlich** für:

- **Auth** (X/Twitter OAuth)
- **Database** (`artifacts` + `votes`)
- **Storage** (Artifact Images)

Keine weiteren Backend-Services.

## Environment Variables (required)

> In Vite sind `NEXT_PUBLIC_*` Variablen erlaubt (siehe `vite.config.ts` `envPrefix`).

Beispiel `.env`:

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon-key>"

# Project constants
NEXT_PUBLIC_TOKEN_MINT="7S2bVZJYAYQwN6iwwf2fMMWu15ajLveh2QDYhtJ3pump"
NEXT_PUBLIC_DEX_LINK="https://dexscreener.com/solana/earthgewsskrbg6cmvx9ddxntniac4shmsthr5nnxwji"
NEXT_PUBLIC_X_COMMUNITY_URL="https://x.com/i/communities/2009563480613949770"
NEXT_PUBLIC_TOKEN_SYMBOL="HORNY"

# Optional holders provider (default OFF)
# none | solscan | helius
NEXT_PUBLIC_HOLDERS_PROVIDER="none"
```

## Supabase Project Setup

### Create project

1. Neues Supabase Projekt anlegen.
2. Unter **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Auth: X/Twitter OAuth

1. In Supabase: **Authentication → Providers → Twitter** aktivieren.
2. In X Developer Portal eine App erstellen (OAuth 2.0).
3. In Supabase **Redirect URLs** hinzufügen:
   - `http://localhost:5173/archives`
   - `https://<your-prod-domain>/archives`

Nach erfolgreichem Callback wird der User auf **`/archives`** geleitet.

In der UI werden folgende Profilfelder genutzt:

- `user.id`
- `user.user_metadata.user_name` (fallbacks: `preferred_username`, `name`)
- `user.user_metadata.avatar_url`

## Storage

Bucket: **`artifacts`**

- **Public read**
- **Authenticated write**
- Upload-Pfad (Object Name) **muss** sein:
  - `artifacts/{userId}/{uuid}`

Client-seitige Validation vor Upload:

- Typen: `png` / `jpg` / `webp`
- Max: **5MB**

## Database schema + RLS + RPC (required)

Die vollständige SQL (Tables, RLS, Storage-Policies, Voting-Trigger + RPC) liegt als Migration in:

- `supabase/migrations/20260110112710_610ed6e7-069d-45f4-b153-ba23e9136b34.sql`

Du kannst sie ausführen über:

- Supabase SQL Editor (Copy/Paste), oder
- Supabase CLI (wenn im Projekt genutzt).

### Tabellen

**`artifacts`**

- `id uuid primary key default gen_random_uuid()`
- `image_url text not null`
- `caption text not null`
- `tags text[] not null`
- `author_id uuid not null`
- `author_handle text`
- `author_avatar text`
- `created_at timestamptz default now()`
- `votes_count int default 0`

**`votes`**

- `artifact_id uuid references artifacts(id) on delete cascade`
- `user_id uuid not null`
- `created_at timestamptz default now()`
- `primary key (artifact_id, user_id)`

### RLS Policies

RLS ist für beide Tabellen aktiv.

**artifacts**

- SELECT: erlaubt für alle
- INSERT: nur wenn `auth.uid() = author_id`

**votes**

- SELECT: erlaubt für alle
- INSERT: nur wenn `auth.uid() = user_id`
- DELETE: nur wenn `auth.uid() = user_id`

### Voting atomicity (RPC)

Client sollte **nur** über RPC voten (optimistic UI + revert on error):

- `rpc_vote(p_artifact_id uuid) returns json`
- `rpc_unvote(p_artifact_id uuid) returns json`

RPC nutzt **`auth.uid()`** (kein `user_id` Parameter) und liefert:

- `success` (boolean)
- `votes_count` (int)
- `error` (text | null)

## Gamification tables + service role (required)

Für XP, Levels, Badges und tägliche Limits werden zusätzliche Tabellen benötigt:

- `user_stats`
- `badges`
- `user_badges`
- `user_daily_limits`

Die SQL-Vorlage inkl. RLS-Hinweisen findest du in:

- `docs/SUPABASE_SQL.md`

**Wichtig:** `/api/event` schreibt serverseitig über den **Service Role Key**. Stelle sicher, dass das Backend folgende Umgebungsvariablen kennt:

```bash
SUPABASE_URL="https://<project-ref>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
```

## App Routes

- `/archives` — Feed (Live / Top all time / Top 24h, Tag-Filter, Search)
- `/archives/:id` — Detail + “more from author”
- `/profile` — Eigene Artifacts (`author_id = auth.uid()`)
