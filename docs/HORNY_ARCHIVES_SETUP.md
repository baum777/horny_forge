# HORNY ARCHIVES Setup Guide

## Environment Variables

### Public (Client-side)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_TOKEN_MINT=7S2bVZJYAYQwN6iwwf2fMMWu15ajLveh2QDYhtJ3pump
NEXT_PUBLIC_DEX_LINK=https://dexscreener.com/solana/earthgewsskrbg6cmvx9ddxntniac4shmsthr5nnxwji
NEXT_PUBLIC_X_COMMUNITY_URL=https://x.com/i/communities/2009563480613949770
NEXT_PUBLIC_TOKEN_SYMBOL=HORNY
```

### Server-only
```env
OPENAI_API_KEY=your_openai_api_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Supabase Setup

1. Create a Supabase project
2. Run the SQL migrations from `docs/SUPABASE_SQL.md`
3. Configure X OAuth in Supabase Dashboard:
   - Go to Authentication > Providers
   - Enable Twitter/X provider
   - Add your X API credentials
   - Set redirect URL to: `https://your-domain.com/auth/callback`

## Base Images

Place 4 PNG images in `/public/bases/`:
- `base-01-unicorn-head.png`
- `base-02-landscape.png`
- `base-03-jesus-meme.png`
- `base-04-rocket.png`

See `/public/bases/README.md` for details.

## Build & Deploy

```bash
npm install
npm run build
npm start
```

For Vercel deployment, ensure all environment variables are set in the Vercel dashboard.
