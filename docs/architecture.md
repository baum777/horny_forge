# Architecture

## Decision
**Option B: Vite frontend + Express backend** is the single production architecture for this repo.

## Deploy Target
- **Frontend**: Vite build deployed as a static site (e.g., Vercel static hosting).
- **Backend**: Express API deployed as a separate service (e.g., Vercel Serverless/Container or another managed node service).

## API Entry Points
- **Forge**: `POST /api/forge`
- **Forge Release**: `POST /api/forge/release`
- **Gamification Events**: `POST /api/event`

## Client Routing
- The Vite dev server proxies `/api/*` to the backend service for local development.
- Production clients must be configured to call the backend service base URL for `/api/*`.
