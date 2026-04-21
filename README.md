# APIfyn

**No-code API automation platform.** Connect services like GitHub, Slack, Gmail, Discord, Notion, and Stripe — then build visual workflows that trigger automatically.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS v4 |
| Backend | Express 4, JWT auth, Google OAuth |
| Database | PostgreSQL, Prisma ORM |
| Queue | BullMQ, Redis, dedicated worker process |
| Auth | Google Identity Services + custom JWT |
| Monorepo | pnpm workspaces |

## Project Structure

```
.
├── app/                     Next.js App Router (pages & layouts)
│   ├── (dashboard)/         Authenticated pages (dashboard, workflows, etc.)
│   ├── (legal)/             Legal pages
│   └── (marketing)/         Public marketing pages
├── components/              Shared UI components, layout, providers
├── features/                Feature modules (workflows, analytics, etc.)
│   └── workflows/builder/   Visual workflow builder
├── hooks/                   Shared React hooks (useFetch, useMutation, etc.)
├── lib/                     API client, utilities
├── packages/
│   ├── api/                 Express backend
│   │   └── src/
│   │       ├── integrations/    Integration handlers (GitHub, Slack, Gmail, etc.)
│   │       ├── middleware/      Auth, rate limiting, error handling
│   │       ├── queue/           BullMQ queue + worker
│   │       ├── routes/          REST API routes
│   │       └── services/        Business logic (workflow executor, OAuth, etc.)
│   └── database/            Prisma schema, migrations, seed
└── infrastructure/          Docker & deployment configs
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for local Redis)

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env and fill in values
cp .env.example .env

# 3. Start Redis
docker compose -f infrastructure/docker/docker-compose.dev.yml up -d

# 4. Generate Prisma client & run migrations
pnpm db:generate
pnpm db:migrate

# 5. Start everything (web + api + worker)
pnpm mprocs
```

This starts three processes:

| Process | URL | Description |
|---------|-----|-------------|
| **web** | `http://localhost:3000` | Next.js frontend |
| **api** | `http://localhost:5000` | Express API |
| **worker** | — | BullMQ workflow executor |

### Available Scripts

```bash
pnpm dev            # Start Next.js only
pnpm dev:api        # Start Express API only
pnpm dev:worker     # Start BullMQ worker only
pnpm mprocs         # Start all three at once

pnpm build          # Build frontend
pnpm build:api      # Build API

pnpm lint           # Biome lint check
pnpm format         # Biome auto-format
pnpm typecheck      # TypeScript type check

pnpm db:generate    # Regenerate Prisma client
pnpm db:migrate     # Run database migrations
pnpm db:studio      # Open Prisma Studio
```

## Environment Variables

Copy `.env.example` to `.env` at the project root. Both the frontend and API read from this single file.

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | API base URL (`http://localhost:5000`) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID (frontend) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID (backend) |
| `JWT_SECRET` | Yes | Secret for signing JWTs |
| `REDIS_URL` | Yes | Redis connection (`redis://localhost:6379`) |
| `GITHUB_CLIENT_ID` | For GitHub | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | For GitHub | GitHub OAuth app client secret |
| `SLACK_CLIENT_ID` | For Slack | Slack app client ID |
| `SLACK_CLIENT_SECRET` | For Slack | Slack app client secret |
| `SMTP_USER` | For email | Gmail address for sending emails |
| `SMTP_PASS` | For email | Gmail App Password ([generate here](https://myaccount.google.com/apppasswords)) |

See `.env.example` for the full list including Notion, Stripe, Google Sheets, and Calendar.

## Integrations

| Integration | Status | Auth Method |
|-------------|--------|-------------|
| GitHub | Live | OAuth |
| Slack | Live | OAuth |
| Gmail (send) | Live | SMTP (App Password) |
| Discord | Live | Webhook URL (no OAuth) |
| Webhook (generic) | Live | None |
| Google Sheets | Stub | OAuth (planned) |
| Notion | Stub | OAuth (planned) |
| Stripe | Stub | Webhook (planned) |
| Google Calendar | Stub | OAuth (planned) |
| Typeform | Stub | Webhook (planned) |

## How It Works

```
GitHub push → Webhook hits API → BullMQ job queued → Worker picks it up
  → GitHub handler extracts data (filters by event type, branch, etc.)
  → Runs each block in order (conditions, actions)
  → Slack message sent / Email sent / Discord posted / etc.
```

1. User signs in with Google.
2. Connects integrations (GitHub, Slack, etc.) via OAuth.
3. Builds a workflow visually — drag triggers, add actions, connect them.
4. Configures each block (event types, branch filters, message templates with `{{variables}}`).
5. Saves and activates the workflow.
6. When an event fires (e.g. GitHub push), the webhook enqueues a BullMQ job.
7. The worker executes blocks in topological order, piping output between them.

## License

Private — not open source.
