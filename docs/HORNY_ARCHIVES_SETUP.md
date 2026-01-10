# THE HORNY ARCHIVES - Setup Guide

## Overview

THE HORNY ARCHIVES is a community meme gallery with voting, sharing, and user profiles.

## Features

- 🖼️ Gallery feed with filtering and sorting
- 🔐 Authentication (Email/Password + X/Twitter OAuth)
- 📤 Image upload with captions and tags
- ❤️ Voting system with optimistic UI
- 🔗 Share to X + copy link/text
- 👤 User profiles with uploaded artifacts

## Environment Variables

The following are automatically configured by Lovable Cloud:

```
VITE_SUPABASE_URL=<your-project-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
```

## Database Schema

### Tables

1. **artifacts** - Stores uploaded meme artifacts
   - id, image_url, caption, tags, author_id, author_handle, author_avatar, created_at, votes_count

2. **votes** - Tracks user votes on artifacts
   - artifact_id, user_id, created_at

### Triggers

- `on_vote_insert`: Increments `votes_count` on artifact
- `on_vote_delete`: Decrements `votes_count` on artifact

## Storage

- **Bucket**: `artifacts` (public read, authenticated write)
- **Path pattern**: `artifacts/{userId}/{uuid}.{ext}`

## Authentication Setup (X/Twitter OAuth)

### Important: URL Configuration

1. In Lovable Cloud settings, configure:
   - **Site URL**: Your app's URL (e.g., `https://your-app.lovable.app`)
   - **Redirect URLs**: 
     - `https://your-app.lovable.app/archives`
     - `http://localhost:5173/archives` (for local dev)

### Setting up X/Twitter Provider

1. Create a Twitter Developer account at https://developer.twitter.com
2. Create a new App and get your API Key and API Secret
3. In your app settings, add callback URL matching your redirect URL
4. Enable OAuth 2.0 and set "Type of App" to "Web App"
5. Add the credentials in Lovable Cloud under Authentication > Providers > Twitter

## Routes

- `/archives` - Main gallery feed
- `/archives/:id` - Artifact detail page
- `/profile` - User's uploaded artifacts (auth required)

## Predefined Tags

#CroisHorney, #EichHorney, #PopHorney, #CornyHorney, #PixelHorney, #ChromeHorney, #UniHorney, #WildHorney, #BrainHorney, #MetaHorney, #CosmicHorney, #ZenHorney, #PumpHorney, #BagHorney, #SignalHorney, #MoonHorney, #GoldHorney

## Future Integration Points

- Real-time updates via Supabase Realtime (already prepared with RLS)
- Image moderation (content filtering before upload)
- Reporting system
- Leaderboards
