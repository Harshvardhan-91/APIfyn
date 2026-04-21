# APIfyn

**No-code API automation platform.** Connect services like GitHub, Slack, Gmail, Discord, Notion, and Stripe — then build visual workflows that trigger and run automatically.

APIfyn lets you create event-driven automations without writing code. A GitHub push can trigger a Slack notification, send a summary email, and log it to a spreadsheet — all configured through a visual drag-and-drop builder.

---

## Tech Stack

| Layer | Technology |
|-------------|-----------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| UI | shadcn/ui component system, Lucide icons |
| Backend | Express 4, TypeScript, JWT auth |
| Database | PostgreSQL 15, Prisma ORM |
| Queue | BullMQ + Redis for async workflow execution |
| Auth | Google Identity Services → backend verifies → issues custom JWT |
| Linting | Biome (replaces ESLint + Prettier) |
| Monorepo | pnpm workspaces (`packages/api`, `packages/database`) |
| Infrastructure | Docker Compose (dev & prod), mprocs for local multi-process |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend                               │
│  Next.js 15 (App Router) • React 19 • Tailwind CSS v4          │
│  ┌────────────┐ ┌────────────┐ ┌──────────────────────────┐    │
│  │ Landing    │ │ Dashboard  │ │ Workflow Builder          │    │
│  │ Pricing    │ │ Analytics  │ │ (drag-and-drop blocks,    │    │
│  │ Legal      │ │ Settings   │ │  config panel, variables) │    │
│  └────────────┘ └────────────┘ └──────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API (JWT auth)
┌────────────────────────────▼────────────────────────────────────┐
│                         API Server                              │
│  Express 4 • TypeScript • Prisma ORM                            │
│  ┌──────────┐ ┌──────────────┐ ┌─────────────────────────────┐ │
│  │ Routes   │ │ Services     │ │ Integration Handlers        │ │
│  │ auth     │ │ oauth        │ │ GitHub  (trigger + filter)  │ │
│  │ workflow │ │ webhook      │ │ Slack   (trigger + send)    │ │
│  │ webhook  │ │ dashboard    │ │ Discord (trigger + send)    │ │
│  │ user     │ │ notification │ │ Gmail   (send via SMTP)     │ │
│  │ integr.  │ │ executor     │ │ Sheets / Notion / Stripe    │ │
│  └──────────┘ └──────────────┘ └─────────────────────────────┘ │
└──────────┬──────────────────────────────────┬───────────────────┘
           │                                  │
    ┌──────▼──────┐                    ┌──────▼──────┐
    │ PostgreSQL  │                    │    Redis    │
    │ (Prisma)    │                    │  (BullMQ)   │
    └─────────────┘                    └──────┬──────┘
                                              │
                                       ┌──────▼──────┐
                                       │   Worker    │
                                       │ (BullMQ)    │
                                       │ Processes   │
                                       │ workflow    │
                                       │ jobs async  │
                                       └─────────────┘
```

## Project Structure

```
.
├── app/                          Next.js App Router (pages & layouts)
│   ├── (dashboard)/              Authenticated pages
│   │   ├── layout.tsx            Dashboard shell (sidebar, auth guard)
│   │   ├── dashboard/            Overview with stats & recent activity
│   │   ├── workflows/            List, detail, create, edit routes
│   │   │   ├── page.tsx          Workflow list
│   │   │   ├── create/           Create new workflow (builder)
│   │   │   └── [id]/             Detail + edit by ID
│   │   ├── analytics/            Execution metrics & charts
│   │   ├── integrations/         Connect/manage OAuth integrations
│   │   ├── templates/            Pre-built workflow templates
│   │   ├── profile/              User account & API keys
│   │   └── settings/             Notification prefs & config
│   ├── (legal)/                  Contact, privacy, terms, shipping pages
│   ├── (marketing)/              Pricing page
│   ├── layout.tsx                Root layout (fonts, metadata, providers)
│   ├── page.tsx                  Landing page
│   └── globals.css               Tailwind v4 theme & base styles
│
├── components/
│   ├── icons/                    Brand SVG icons (Google, GitHub, Slack, etc.)
│   ├── layout/
│   │   ├── public-navbar.tsx     Marketing navbar (Google sign-in button)
│   │   └── auth-navbar.tsx       Dashboard navbar (nav links, user avatar)
│   ├── providers/
│   │   ├── auth-provider.tsx     Google OAuth + JWT context
│   │   └── payment-provider.tsx  Stripe subscription context
│   └── ui/                       Reusable primitives (Button, Card, Input, Textarea)
│
├── features/                     Feature modules (one dir per domain)
│   ├── analytics/                Analytics charts & metrics
│   ├── dashboard/                Dashboard overview component
│   ├── integrations/             Integration management UI
│   ├── landing/                  Landing, pricing, contact, legal pages
│   ├── profile/                  Profile management
│   ├── settings/                 Settings UI
│   ├── templates/                Workflow template browser
│   └── workflows/
│       ├── workflows-page.tsx    Workflow list with filters
│       ├── workflow-detail-page.tsx  Detail view, test, execution history
│       └── builder/              Visual workflow builder
│           ├── types.ts          Block & connection type definitions
│           ├── builder-canvas.tsx   Drag-and-drop canvas with connection lines
│           ├── builder-sidebar.tsx  Sidebar wrapper
│           ├── block-library.tsx    Categorized block palette
│           ├── config-panel.tsx     Dynamic config forms, variable tags
│           └── workflow-builder-page.tsx  Builder shell (sidebar, canvas, config)
│
├── hooks/
│   ├── api/use-auth.ts           Auth state hook
│   ├── use-fetch.ts              SWR-based data fetching wrapper
│   ├── use-mutation.ts           POST/PUT/DELETE mutation hook
│   └── use-mobile.ts             Responsive breakpoint hook
│
├── lib/
│   ├── api/
│   │   ├── client.ts             Authenticated fetch wrapper (JWT auto-attach)
│   │   └── types.ts              TypeScript interfaces for all API entities
│   ├── logger.ts                 Pino-based structured logging
│   └── utils.ts                  cn() class helper, formatDate utility
│
├── packages/
│   ├── api/                      Express backend
│   │   ├── src/
│   │   │   ├── index.ts          Server entry (CORS, routes, health, shutdown)
│   │   │   ├── worker.ts         Standalone BullMQ worker process
│   │   │   ├── db.ts             Prisma client singleton
│   │   │   ├── load-env.ts       Robust .env loading
│   │   │   ├── middleware/       Auth, API key, rate limit, error handler
│   │   │   ├── routes/           REST endpoints (auth, workflow, webhook, etc.)
│   │   │   ├── services/         Business logic
│   │   │   │   ├── workflow-executor.ts  Sequential block execution engine
│   │   │   │   ├── oauth.service.ts      Token exchange (GitHub/Slack/Discord)
│   │   │   │   ├── webhook.service.ts    Payload validation & routing
│   │   │   │   ├── dashboard.service.ts  Aggregated analytics
│   │   │   │   └── ...
│   │   │   ├── queue/            BullMQ connection, queues, worker setup
│   │   │   └── integrations/     Plugin-style integration system
│   │   │       ├── base.ts       Abstract IntegrationHandler
│   │   │       ├── registry.ts   Handler lookup registry
│   │   │       ├── template.ts   {{variable}} replacement engine
│   │   │       └── handlers/     One file per integration
│   │   │           ├── github.handler.ts   Event detection, branch/PR filtering
│   │   │           ├── slack.handler.ts    Trigger + send (bot name, threads)
│   │   │           ├── discord.handler.ts  Trigger + webhook send
│   │   │           ├── gmail.handler.ts    SMTP send with branded HTML template
│   │   │           ├── webhook.handler.ts  Generic HTTP sender
│   │   │           ├── sheets.handler.ts   Google Sheets (append/overwrite)
│   │   │           ├── notion.handler.ts   Page creation with tags
│   │   │           ├── stripe.handler.ts   Stripe event trigger
│   │   │           ├── typeform.handler.ts Typeform webhook trigger
│   │   │           ├── calendar.handler.ts Google Calendar trigger
│   │   │           ├── condition.handler.ts  Conditional branching
│   │   │           ├── delay.handler.ts      Configurable delay
│   │   │           └── utility.handler.ts    General-purpose block
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   └── database/                 Prisma schema & migrations
│       ├── prisma/
│       │   ├── schema.prisma     All data models (User, Workflow, Execution, etc.)
│       │   ├── seed.ts           Database seeder
│       │   └── migrations/       SQL migration history
│       ├── src/index.ts          Prisma client re-export
│       ├── package.json
│       └── tsconfig.json
│
├── infrastructure/
│   ├── docker/
│   │   ├── docker-compose.dev.yml   Redis + PostgreSQL for local dev
│   │   └── docker-compose.prod.yml  Full production stack
│   └── dockerfiles/
│       └── Dockerfile.prod          API production image
│
├── biome.json                    Linter & formatter config
├── components.json               shadcn/ui config
├── mprocs.yaml                   Multi-process runner (web + api + worker)
├── Makefile                      Dev shortcuts (make dev, make db:migrate, etc.)
├── next.config.ts                Next.js 15 config
├── tsconfig.json                 Root TypeScript config
├── postcss.config.mjs            PostCSS + Tailwind v4
├── pnpm-workspace.yaml           Workspace package definitions
└── .env.example                  All environment variable docs
```

## Getting Started

### Prerequisites

- **Node.js** 20+
- **pnpm** 9+ (`npm i -g pnpm`)
- **Docker** & Docker Compose (for local Redis + PostgreSQL)

### Setup

```bash
# 1. Clone and install
git clone https://github.com/your-username/APIfyn-frontend.git
cd APIfyn-frontend
pnpm install

# 2. Copy env and fill in your values
cp .env.example .env

# 3. Start infrastructure (Redis + PostgreSQL)
docker compose -f infrastructure/docker/docker-compose.dev.yml up -d

# 4. Generate Prisma client and run migrations
pnpm db:generate
pnpm db:migrate

# 5. (Optional) Seed the database
pnpm db:seed

# 6. Start everything — frontend + API + worker
pnpm mprocs
```

### What `pnpm mprocs` Starts

| Process | URL | Description |
|---------|-----|-------------|
| **web** | `http://localhost:3000` | Next.js frontend |
| **api** | `http://localhost:5000` | Express REST API |
| **worker** | — | BullMQ background job processor |
| **proxy** | `http://localhost:3001` | Dev proxy (avoids CORS) |

### Available Scripts

```bash
# Development
pnpm dev              # Next.js frontend only
pnpm dev:api          # Express API only
pnpm dev:worker       # BullMQ worker only
pnpm mprocs           # All processes at once

# Build
pnpm build            # Build frontend for production
pnpm build:api        # Compile API TypeScript

# Code quality
pnpm lint             # Biome lint check
pnpm format           # Biome auto-format
pnpm typecheck        # TypeScript type check

# Database
pnpm db:generate      # Regenerate Prisma client after schema changes
pnpm db:migrate       # Run pending database migrations
pnpm db:studio        # Open Prisma Studio (visual DB editor)
pnpm db:seed          # Seed database with sample data
```

## Environment Variables

Copy `.env.example` to `.env` at the project root. Both the frontend and API read from this single file.

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | API base URL (`http://localhost:5000`) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID (used by frontend) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID (used by backend) |
| `JWT_SECRET` | Yes | Random secret for signing JWTs (min 32 chars) |
| `REDIS_URL` | Yes | Redis connection URL (`redis://localhost:6379`) |
| `ALLOWED_ORIGINS` | Yes | Comma-separated allowed CORS origins |
| `BASE_URL` | Yes | Public URL of the API server |
| `GITHUB_CLIENT_ID` | For GitHub | GitHub OAuth App — Client ID |
| `GITHUB_CLIENT_SECRET` | For GitHub | GitHub OAuth App — Client Secret |
| `GITHUB_WEBHOOK_SECRET` | For GitHub | Shared secret for webhook signature validation |
| `SLACK_CLIENT_ID` | For Slack | Slack App — Client ID |
| `SLACK_CLIENT_SECRET` | For Slack | Slack App — Client Secret |
| `SMTP_USER` | For email | Gmail address used as the sender |
| `SMTP_PASS` | For email | Gmail App Password ([generate here](https://myaccount.google.com/apppasswords)) |
| `SMTP_HOST` | For email | SMTP server hostname (default: `smtp.gmail.com`) |
| `SMTP_PORT` | For email | SMTP port (default: `587`) |
| `NOTION_CLIENT_ID` | For Notion | Notion integration OAuth — Client ID |
| `NOTION_CLIENT_SECRET` | For Notion | Notion integration OAuth — Client Secret |
| `GOOGLE_API_CLIENT_ID` | For Sheets/Calendar | Google API OAuth — Client ID |
| `GOOGLE_API_CLIENT_SECRET` | For Sheets/Calendar | Google API OAuth — Client Secret |
| `STRIPE_API_KEY` | For Stripe | Stripe secret API key |
| `STRIPE_WEBHOOK_SECRET` | For Stripe | Stripe webhook signing secret |

See `.env.example` for the full list with defaults and comments.

## Data Models

| Model | Description |
|-------|-------------|
| `User` | Google-authenticated user with profile, API usage counters |
| `Integration` | Connected service (GitHub, Slack, etc.) with OAuth tokens |
| `Workflow` | User-created automation with JSON block definition |
| `WorkflowExecution` | Individual run record with status, duration, I/O data |
| `Plan` | Subscription tier with limits and pricing |

## Integrations

| Integration | Type | Status | Auth Method | Capabilities |
|-------------|------|--------|-------------|-------------|
| GitHub | Trigger | Live | OAuth | Push, PR, issues, releases — branch & action filtering |
| Slack | Trigger + Action | Live | OAuth | Receive events / send messages (bot name, threads) |
| Gmail | Action | Live | SMTP | Send branded HTML emails with template variables |
| Discord | Trigger + Action | Live | Webhook URL | Receive events / send messages (bot name, avatar) |
| Webhook | Trigger + Action | Live | None | Receive/send generic HTTP with custom headers |
| Google Sheets | Action | Stub | OAuth (planned) | Append or overwrite spreadsheet rows |
| Notion | Action | Stub | OAuth (planned) | Create pages with status and tags |
| Stripe | Trigger | Stub | Webhook (planned) | Payment & subscription event triggers |
| Google Calendar | Trigger | Stub | OAuth (planned) | Calendar event triggers |
| Typeform | Trigger | Stub | Webhook (planned) | Form submission triggers |

## How It Works

### Workflow Execution Flow

```
External Event (e.g. GitHub push)
  │
  ▼
Webhook endpoint receives payload (/api/webhooks/:type/:workflowId)
  │
  ▼
Validate payload → find matching Workflow → create WorkflowExecution (PENDING)
  │
  ▼
Enqueue BullMQ job with { workflowId, executionId, payload }
  │
  ▼
Worker picks up job from Redis queue
  │
  ▼
WorkflowExecutor processes blocks in order:
  1. Trigger handler extracts & normalizes data (event type, branch, etc.)
  2. Apply filters (event type, branch, PR actions) → skip if no match
  3. For each action block:
     a. Fill {{template}} variables from trigger output
     b. Execute handler (send Slack msg, email, HTTP request, etc.)
     c. Pass output to next block as context
  │
  ▼
Mark execution as SUCCESS or FAILED with duration + output data
```

### User Journey

1. **Sign in** with Google (Identity Services on frontend → JWT issued by backend).
2. **Connect integrations** — OAuth flows for GitHub, Slack; paste webhook URL for Discord.
3. **Build a workflow** — drag trigger and action blocks onto the visual canvas, connect them.
4. **Configure blocks** — set event filters, message templates with `{{variables}}`, recipients.
5. **Save & activate** — the workflow starts listening for events.
6. **Events fire** — webhooks are received, jobs queued, blocks executed in sequence.
7. **Monitor** — view execution history, success rates, and test workflows from the detail page.

### Visual Workflow Builder

The builder provides a drag-and-drop interface for composing automations:

- **Block Library** — categorized triggers and actions (Communication, Data, Utility)
- **Canvas** — drop blocks, reorder them, connect with visual lines
- **Config Panel** — per-block settings with contextual `{{variable}}` suggestions
- **Template Variables** — reference trigger data in action configs (e.g. `{{commit.message}}`, `{{sender.name}}`)

### Template Variable System

Each trigger exposes specific variables that downstream actions can reference:

| Trigger | Available Variables |
|---------|-------------------|
| GitHub | `{{event}}`, `{{repo.name}}`, `{{repo.url}}`, `{{sender.name}}`, `{{branch}}`, `{{commit.message}}`, `{{commit.url}}`, `{{pr.title}}`, `{{pr.url}}`, `{{pr.action}}` |
| Slack | `{{channel}}`, `{{user}}`, `{{text}}`, `{{timestamp}}` |
| Discord | `{{channel}}`, `{{author}}`, `{{content}}` |
| Stripe | `{{event}}`, `{{amount}}`, `{{currency}}`, `{{customer}}` |
| Typeform | `{{formId}}`, `{{responseId}}`, `{{answers}}` |
| Calendar | `{{event}}`, `{{summary}}`, `{{start}}`, `{{end}}` |
| Webhook | `{{body}}` (raw JSON), `{{headers}}`, `{{method}}` |

## Deployment

### Docker (Production)

```bash
# Build and start all services
docker compose -f infrastructure/docker/docker-compose.prod.yml up --build -d
```

### Vercel (Frontend)

The frontend is configured for Vercel deployment. Push to `main` to auto-deploy.

```bash
# Manual deploy
vercel --prod
```

### Manual

```bash
pnpm build          # Build Next.js frontend
pnpm build:api      # Compile API TypeScript
node packages/api/dist/index.js   # Start API server
node packages/api/dist/worker.js  # Start worker (separate process)
```

## License

Private — not open source.
