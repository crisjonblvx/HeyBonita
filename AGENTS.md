# AGENTS.md

## Cursor Cloud specific instructions

### Overview

HeyBonita / BonitaCore is a single Next.js 15 application (not a monorepo) serving both the frontend UI and a set of API routes under `/api/core/v1/*`. It's a culturally-rooted AI chatbot and knowledge platform.

### Running the app

- **Dev server:** `pnpm dev` (port 3000)
- **Lint:** `pnpm lint`
- **Build:** `pnpm build`
- See `package.json` `scripts` for all available commands.

### Environment variables

Copy `.env.example` to `.env` and fill in values. Key variables:

- `BONITACORE_SERVICE_TOKEN` / `NEXT_PUBLIC_BONITA_SERVICE_TOKEN` — must match; needed for API auth.
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — required by middleware (even placeholder values prevent crash). If left empty, the middleware throws at runtime.
- `BONITA_BRAIN_PROVIDER` — `ollama` (default, local) or `anthropic` (cloud).

### Gotchas

- **Middleware requires Supabase env vars**: Even without a real Supabase instance, `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be set to non-empty values (e.g. `https://placeholder.supabase.co` and a dummy JWT). Otherwise the Supabase SSR client throws in middleware and all matched routes (including `/landing`, `/auth`) return 500.
- **Build script approval**: pnpm blocks build scripts by default. The `pnpm.onlyBuiltDependencies` field in `package.json` allows `@tailwindcss/oxide`, `esbuild`, `sharp`, and `unrs-resolver`. If new native dependencies are added, they must be added to this list.
- **ESLint version**: `eslint-config-next` must match the Next.js version (15.2.x). Using a mismatched version (e.g. 16.x) causes circular structure errors with `next lint`.
- **No automated test suite**: The codebase has no unit/integration test framework configured. Testing is manual via the dev server and API endpoints.
- **External services degrade gracefully**: Supabase brain, Ollama, and other providers return errors in API responses but don't crash the app. The health endpoint at `/api/core/v1/health` is useful for checking connectivity status.
