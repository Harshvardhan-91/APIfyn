# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Despite the `APIfyn-frontend` name, this is a **pnpm monorepo containing the whole stack**:

- **Root** (`app/`, `components/`, `features/`, `hooks/`, `lib/`) — the Next.js 15 App Router frontend (the root `package.json` is the web app).
- **`packages/api`** (`@apifyn/api`) — Express 4 REST API **and** the BullMQ worker (`src/index.ts` = server, `src/worker.ts` = worker).
- **`packages/database`** (`@apifyn/database`) — Prisma schema, migrations, generated client. Imported by both the API and (via `transpilePackages`) the frontend.

APIfyn is a no-code automation platform: external events hit webhooks → jobs are queued in Redis → the worker executes workflow blocks (triggers/actions) in order. See `README.md` for the full execution-flow and integration catalog.

## Commands

```bash
# Dev — mprocs runs web + api + worker together (reads mprocs.yaml)
mprocs                    # all processes; web :3000, api :5000
pnpm dev                  # frontend only
pnpm dev:api              # API server only
pnpm dev:worker           # BullMQ worker only

# Build
pnpm build                # frontend (next build)
pnpm build:api            # API (generates Prisma client, then tsc)

# Quality
pnpm lint                 # Biome check — SEE SCOPE NOTE BELOW
pnpm format               # Biome format --write
pnpm typecheck            # tsc --noEmit — FRONTEND ONLY (api excluded)

# Database (all run against the root .env)
pnpm db:generate          # regenerate Prisma client after schema edits
pnpm db:migrate           # prisma migrate dev
pnpm db:studio
pnpm db:seed

# Tests — ONLY packages/api has tests (Jest)
pnpm test                 # all api tests
pnpm --filter @apifyn/api test:unit          # unit only
pnpm --filter @apifyn/api test:integration   # integration only
pnpm --filter @apifyn/api test -- -t "name substring"    # single test by name
pnpm --filter @apifyn/api test -- src/__tests__/unit/foo.test.ts   # single file
```

Local infra (Redis + Postgres) comes from `docker compose -f infrastructure/docker/docker-compose.dev.yml up -d`.

## Tooling scope — important gotchas

- **Biome and root tsc do NOT cover `packages/api`.** `biome.json` ignores `packages/api/**`, and root `tsconfig.json` excludes `packages/api` + migrations. So `pnpm lint` / `pnpm format` / `pnpm typecheck` operate on the frontend (+ database sources) only. The API is type-checked separately by its own `tsc` during `pnpm build:api`. When you change API code, run `pnpm build:api` to catch type errors.
- **Single shared `.env` at the repo root.** Both frontend and API read it (`NEXT_PUBLIC_*` for the browser). Database scripts explicitly load it via `dotenv -e ../../.env`.
- **Biome config:** 2-space indent, `organizeImports` on, `noExplicitAny` off, `useImportType` warns.

## Frontend architecture

- **Path aliases:** `@/*` → repo root, `@apifyn/database` → `packages/database/src`.
- **`app/` route groups:** `(dashboard)` = authenticated pages (its `layout.tsx` is the auth guard — shows loader/sign-in gate based on `useAuth()`), `(marketing)`, `(legal)`, plus `admin/`. Page components are thin; real UI lives in **`features/<domain>/`** (one dir per domain, e.g. `features/workflows/builder/` is the drag-and-drop builder).
- **API access is centralized:** everything goes through `apiFetch<T>(path, { token })` in `lib/api/client.ts` (throws on non-2xx). Do not call `fetch` to the backend directly.
  - **Reads:** `useFetch<T>(path)` (`hooks/use-fetch.ts`) — an SWR wrapper that keys on `[path, token]` and returns nothing until the user is authenticated.
  - **Writes:** `useMutation<In,Out>(path, method)` (`hooks/use-mutation.ts`).
- **Auth:** `components/providers/auth-provider.tsx` — Google OAuth (`@react-oauth/google`) → backend issues a JWT → stored in `localStorage` under `apifyn_token` → session restored via `GET /api/auth/me`. Consume with `useAuth()`. `AppUser.token` is the bearer token passed to `apiFetch`.
- **UI:** shadcn/ui ("new-york" style) primitives in `components/ui/`; Tailwind CSS v4 (theme in `app/globals.css`); `cn()` from `lib/utils.ts`; Lucide icons; brand SVGs in `components/icons/`.

## Backend / integration architecture

The workflow engine uses a **plugin registry** for integration blocks:

- `packages/api/src/integrations/base.ts` — the `IntegrationHandler` interface (`blockId` + `execute(config, ctx)` returning `BlockResult`).
- `registry.ts` — a singleton map from `blockId` → handler.
- `handlers/*.handler.ts` — one file per integration; each registers itself with `IntegrationRegistry` as an import side-effect.
- `handlers/register.ts` — imports every handler file. **To add a new integration:** create `handlers/<name>.handler.ts` (register in it) and add the import line to `register.ts`. `register.ts` is imported once at the top of `src/index.ts`.
- `services/workflow-executor.ts` runs a workflow: the trigger handler normalizes the event, filters are applied, then each action block fills `{{template}}` variables (`integrations/template.ts`) and executes, passing output forward as context.

Routes live in `packages/api/src/routes/` (`auth`, `workflow`, `webhook`, `integration`, `user`, `subscription`, `notification`, `admin`, `ai`), services in `src/services/`, BullMQ setup in `src/queue/`. Prisma models (`User`, `Integration`, `Workflow`, `WorkflowExecution`, `Plan`) are in `packages/database/prisma/schema.prisma`.
