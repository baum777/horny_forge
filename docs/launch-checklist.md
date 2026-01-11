# Launch Checklist (Fast + Stable)

## Merge-blocking CI gate
- [ ] CI workflow runs install, lint, typecheck, and tests; merge blocked on failures.
- [ ] `npm test` runs the server smoke suite locally and in CI.

## Required environment validation
- [ ] Server fails fast on missing: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SHARE_TOKEN_SECRET`, `SITE_URL`, `OPENAI_API_KEY`, and token identifiers (`TOKEN_MINT` or `TOKEN_PAIR`/`DEX_LINK`).

## Smoke tests (server)
- [ ] `/api/event` idempotency + invalid vote proof cases covered.
- [ ] Share redirect awards only on valid token.
- [ ] Forge auth/locked/quota gates covered.
- [ ] Release moderation + brand similarity gates covered.
- [ ] Token stats normalized response + cache hit verified.
- [ ] OG wrapper HTML contains expected meta tags.

## Storage / RLS sanity
- [ ] RLS enabled on all tables that accept writes (votes, artifacts, user stats, gamification events, etc.).
- [ ] Storage bucket policies: size limits, MIME constraints, and no anonymous uploads unless explicitly intended.

## Client/server truth alignment
- [ ] Production builds disable client-only gamification logic and demo route.
- [ ] UI renders server-returned stats/results only for levels/badges.

## Staging deploy verification (20–30 min)
- [ ] Forge happy path: preview → release (success state + redirect).
- [ ] Vote flow: vote → creator reward via proof.
- [ ] Share unfurl: X/Discord/Telegram show correct OG tags.
- [ ] Token pulse loads and doesn’t flicker.
- [ ] Quotas + locked behavior surface correct errors.
