# Backend & Architecture — Current State

## 1. Repository Structure

The project follows a monorepo-like structure containing both frontend and backend code.

- **Root**: Frontend application (Vite, React, Tailwind, Shadcn).
- **`server/`**: Backend application (Node.js, Express).
- **`supabase/`**: Database migrations and configuration.
- **`public/`**: Frontend static assets.
- **`server/public/`**: Backend static assets (specifically base images for generation).

## 2. Backend Setup

### Runtime
- **Environment**: Node.js.
- **Development**: Uses `tsx` for watching and running TypeScript directly (`server/src/index.ts`).
- **Production**: Builds to `server/dist/` via `tsc` and runs with `node`.

### Dependencies
Key dependencies in `server/package.json`:
- `express`: Web server framework.
- `cors`: Cross-Origin Resource Sharing.
- `dotenv`: Environment variable management.
- `openai`: AI image generation.
- `@supabase/supabase-js`: Database interaction.
- `sharp`: Image processing (hashing, resizing).
- `zod`: Schema validation.
- `vitest`: Testing framework.

### Ports
- **Backend Port**: Defaults to `3001` (configurable via `PORT` env var).
- **Frontend Port**: `8080` (configured in `vite.config.ts`).

### Environment Variables
Managed via `.env` file (loaded by `dotenv`). Key variables:
- `PORT`: Server port (default: 3001).
- `NODE_ENV`: Environment mode (development/production/test).
- `OPENAI_API_KEY`: Required for image generation.
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`: Required for database connection.
- `SITE_URL`: Base URL for sharing links.
- `SHARE_TOKEN_SECRET`: Secret for signing share tokens.
- `BASE_IMAGES_PATH`: Path to base images (default: `./server/public/horny_base`).
- `FORGE_RATE_LIMIT_*`: Rate limiting configurations.
- `BRAND_SIMILARITY_THRESHOLD`: Threshold for similarity checks.

### Test Setup
- **Framework**: `vitest`.
- **Config**: `server/vitest.config.ts`.
- **Location**: Tests are located in `server/src/test/` (unit/integration) and `server/test/` (legacy or other).
- **Running**: `npm test` inside `server/` runs `vitest run`.

### Static Asset Handling
- Backend serves static files from `server/public` using `express.static`.
- Default path resolution: `path.join(process.cwd(), 'server', 'public')`.

## 3. Frontend-Backend Interaction

### Proxy Configuration
The frontend (Vite) proxies specific paths to the backend (`http://localhost:3001`):
- `/api`: API endpoints.
- `/health`: Health check endpoint.
- `/horny_base`: Access to backend static base images.

### API Paths
- Frontend makes requests to `/api/...`.
- Backend routes are mounted at `/api` (e.g., `/api/forge`, `/api/gamification`).

## 4. Known Issues / Pitfalls

### Static Asset Path Resolution (CWD Dependency)
- **Issue**: The backend calculates static asset paths relative to `process.cwd()`.
    - `server/src/app.ts`: `path.join(process.cwd(), 'server', 'public')`
    - `server/src/config.ts`: Defaults `BASE_IMAGES_PATH` to `./server/public/horny_base`.
- **Consequence**:
    - If the backend is started from the **repo root** (e.g., `tsx server/src/index.ts`), paths resolve correctly to `[root]/server/public`.
    - If the backend is started from the **`server/` directory** (e.g., `npm run dev` inside `server/`), paths resolve to `[root]/server/server/public`, which does not exist.
- **Current Behavior**: The `server/package.json` scripts (`dev`, `start`) are designed to be run within the `server/` directory, but the code expects to be run from the root.

### Startup Coordination
- **Issue**: There is no single command in the root `package.json` to start both frontend and backend concurrently.
- **Current Behavior**: Developers must run `vite` in the root and `npm run dev` in `server/` (taking care of the CWD issue mentioned above) separately.

### Test Location Inconsistency
- **Issue**: Tests are split between `server/src/test/` and `server/test/`.
- **Current Behavior**: `vitest.config.ts` includes `src/test/**/*.test.ts`. Tests in `server/test/` might be ignored or require separate configuration.

## 5. Planned or Discussed Changes
*(None explicitly visible in the codebase at this snapshot)*

