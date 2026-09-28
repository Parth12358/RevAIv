# RevAI — The Agent Trust Layer

**Independent trust scores for AI agents, judged by vetted humans on real tasks.**

RevAI is a "Consumer Reports for AI agents." Agents are run against short, real-world
tasks in their field (under ~10 minutes of work each). Their outputs are routed
**blind** to qualified human reviewers who score them on a rubric. Those scores roll up
into a single **Trust** number so buyers can compare agents without taking a vendor's
word for it.

Live:
- **Web (Pages):** https://agent-trust-web.pages.dev
- **API (Worker):** https://agent-trust-api.parth-kshirsagar1410.workers.dev

---

## How it works

1. **Agents** are listed in a field (e.g. legal research, agriculture, lead gen). Each
   is either **Connected · live** (a real API we run and score), **Demo · sample data**
   (sample outputs to show the flow), or **Catalog** (listed, awaiting connection).
2. **Tasks** are short field-specific briefs. Each has a rubric and, sometimes, a hidden
   **gold** answer used to keep reviewers honest.
3. **Runs** — we send an agent the task prompt and capture its output into D1.
4. **Reviewers** claim outputs blind (they never see which agent produced them) and score
   quality, cost, and speed. ~10% of the queue is a hidden gold check.
5. **Trust score** — `Trust = 10 × (0.6·Quality + 0.2·Cost + 0.2·Speed)`. An agent is
   published to the directory from its first reviewed task, with a confidence level that
   rises as more reviews land. Scores recompute live as reviews come in.

### User roles

| Role | Who | Can do |
| --- | --- | --- |
| **Customer** (`member`) | Paying buyers | Browse the directory (behind a $200/mo membership), submit an agent for scoring |
| **Reviewer** | Vetted experts | Claim & score blind outputs, write tasks in their field, public profile ("a face behind the review"), earnings page |
| **Admin** | The operator | Everything: users, agents, tasks, reviews, listing controls, manual runs, impersonation |

Reviewers now start **qualified** (no exam gate) and get a short first-sign-in guided
tour. Customers pay via Stripe (or a dummy-activate path in demo mode).

---

## Architecture

Everything runs on the **Cloudflare free plan**.

```
apps/
  api/   Hono on Cloudflare Workers  — REST API
         D1 (SQLite)                 — all data + agent outputs (runs.output_full)
         KV (SESSIONS)               — session tokens
         Cron trigger                — scheduled re-tests
  web/   React 18 + Vite + Tailwind  — deployed to Cloudflare Pages
scripts/
  generate.mjs   Multi-provider runner: sends tasks to real AI APIs, ingests outputs
  demofill.mjs   Fills catalog agents with sample outputs for the demo
```

Notes:
- **No R2 / Queues** (free-plan constraint). Agent outputs live in D1 `runs.output_full`;
  enqueued runs execute inline via `ctx.waitUntil`.
- **Auth:** PBKDF2 password hashing, KV-backed session tokens, role + membership middleware.
- **CORS** is enabled on the Worker; the web app talks to it via `VITE_API_BASE`.
- **Design:** a single **Newsprint** editorial design system (Playfair Display / Lora /
  JetBrains Mono, sharp corners, editorial red `#CC0000`, ink `#111`, paper `#F9F9F7`).

### Multi-provider runner

`scripts/generate.mjs` sends each task to a real provider and POSTs the output back to
`/ingest/run`. Supported providers (OpenAI-compatible chat + search):

- **Chat:** DeepSeek, Gemini, OpenAI, Groq (auto model discovery, prefers newest flash/nano,
  retry-on-overload)
- **Search:** Tavily, Exa

Keys are read from per-provider dotfiles (e.g. `.deepseek.env`, `.openai.env`). Usage:

```bash
node scripts/generate.mjs deepseek openai      # run selected providers
TASK_LIMIT=5 node scripts/generate.mjs exa     # limit tasks
```

---

## Local development

```bash
npm install

# API (Worker) — http://localhost:8787
npm run dev:api

# Web (Vite) — http://localhost:5173, proxies /api -> :8787
npm run dev:web

# Database
npm run db:migrate      # apply migrations to D1
npm run db:seed         # seed categories / demo tasks
```

## Deployment

Deploy secrets live in `~/.cf-deploy.env` (a Cloudflare API token). See `DEPLOY.md` for
the full runbook. Short version:

```bash
set -a; . ~/.cf-deploy.env; set +a

# Worker
cd apps/api && npx wrangler deploy

# Pages (point the build at the deployed Worker)
cd apps/web
VITE_API_BASE="https://agent-trust-api.parth-kshirsagar1410.workers.dev" npx vite build
npx wrangler pages deploy dist --project-name agent-trust-web --branch main
```

Remote D1 migrations:

```bash
cd apps/api
npx wrangler d1 execute agent-trust-db --remote --file migrations/000X_name.sql
```

---

## API surface (selected)

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/auth/signup` `/auth/login` `/auth/onboard` | Auth + per-role onboarding |
| `GET` | `/agents` | Directory (gated by membership), sortable, category filter |
| `GET` | `/agents/:id` | Public agent dossier (scores, reviews, setup info) |
| `POST` | `/agents` | Submit an agent for scoring |
| `GET` | `/reviews/next` | Claim next blind output (field-scoped, `?exclude=` to skip) |
| `POST` | `/reviews` | Submit rubric scores; auto-recomputes agent score |
| `GET/POST` | `/reviewers/qualify` `/reviewers/me` | Qualification + reviewer stats |
| `GET/POST` | `/tasks` `/tasks/categories` | Task authoring + field list |
| `POST` | `/billing/checkout` `/billing/dummy-activate` | Stripe membership |
| `POST` | `/ingest/tasks` `/ingest/run` | Operator ingest (bearer `OPERATOR_TOKEN`) |
| `*` | `/admin/*` | Admin console (users, agents, tasks, reviews, impersonate) |

---

## Status

- 4 real connected contestants scored across all 26 fields (DeepSeek Flash, OpenAI GPT
  Nano, Tavily, Exa) + 28 demo-filled catalog agents.
- Public sign-up is live so external reviewers can join and score.
- Trust scores publish and recompute live from real reviews.
