# AGENTS.md

## Cursor Cloud specific instructions

### Overview
HeyBonita (BonitaCore) is a single Next.js 15 application (not a monorepo) serving as an AI-powered cultural knowledge assistant. It uses pnpm as its package manager.

### Running the dev server
```
pnpm dev
```
The app runs on `http://localhost:3000`. See `package.json` for all available scripts.

### Lint / Build / Test
- **Lint**: `pnpm lint` (uses ESLint with `next/core-web-vitals` flat config in `eslint.config.mjs`)
- **Build**: `pnpm build`
- No automated test suite exists in this project.

### Environment setup
The Cursor Cloud secrets `.env` and `.env.local` contain the full env file contents (newlines are replaced with spaces during injection). The update script automatically extracts them to disk. If these secrets are not set, copy `.env.example` and fill in values manually. At minimum, set:
- `BONITACORE_SERVICE_TOKEN` / `NEXT_PUBLIC_BONITA_SERVICE_TOKEN` — any shared secret string
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — required by the auth middleware (even placeholder values prevent crashes)
- `BONITA_BRAIN_PROVIDER` — `ollama` (local) or `anthropic` (cloud)

### Gotchas
- The Next.js middleware (`middleware.ts`) uses Supabase env vars with `!` non-null assertions. Without `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set, protected route requests will fail. Placeholder values are sufficient for local dev if you don't need auth.
- The existing codebase has a lint error in `app/page.tsx` (react-hooks/set-state-in-effect) — this is pre-existing and not a blocker.
- `pnpm.onlyBuiltDependencies` in `package.json` lists packages that need native compilation (`@tailwindcss/oxide`, `esbuild`, `sharp`, `unrs-resolver`). Without this, `pnpm install` will print warnings about ignored build scripts and Tailwind CSS won't work.
- `BONITA_BRAIN_URL` is used for two purposes: in `.env` it may point to an Ollama server (for LLM chat), while in `.env.local` it points to the Supabase "brain" database (for knowledge entries via `getSupabaseBrain()`). `.env.local` takes precedence. The health endpoint reports an ollama_error because it tries to hit Ollama's `/api/tags` at the Supabase URL — this is expected in the current config and does not affect knowledge queries.
- The landing page at `/landing` does not require Supabase auth and is the best page for quick smoke-testing.
- API health check at `/api/core/v1/health` returns JSON status without requiring auth — useful for verifying the server is running.
