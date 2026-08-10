# Architecture

Implementation-facing overview of English Companion OS. The canonical product
specification remains [`MASTER_PLAN.md`](MASTER_PLAN.md).

## System boundaries

English Companion OS is a single-user system with three cooperating parts:

1. **ChatGPT Project + GPT-Live** provides live English practice. It uses the
   versioned coach prompt and exports a session JSON document only when the user
   asks to save a completed session.
2. **Hermes Agent** receives that JSON manually through Telegram, validates it,
   writes normalized records to Supabase, and runs scheduled reviews and weekly
   reports.
3. **Dashboard SPA** reads the same Supabase data and provides authenticated
   history, analytics, and self-graded reviews. It is a static React application
   deployed to GitHub Pages.

```text
ChatGPT Project / GPT-Live
          │ manually exported session JSON
          ▼
User ── Telegram ──► Hermes Agent ── service role ──► Supabase
 ▲                         │                            ▲
 │                         └── reviews and reports      │ anon key + user JWT
 └──────────────── Dashboard SPA ◄─────────────────────┘
```

The manual ChatGPT-to-Hermes handoff is intentional. Do not add scraping,
browser automation, a custom voice client, or direct ChatGPT extraction.

## Source-of-truth boundaries

| Concern | Source of truth |
|---|---|
| Conversational context | ChatGPT Project conversation history |
| Structured learning history and SRS state | Supabase |
| Session interchange contract | `shared/schemas/session.schema.json` |
| Companion behavior template | `shared/persona.md` |
| Companion display name and user settings | Supabase `user_settings` |
| Product and architecture requirements | `docs/MASTER_PLAN.md` |

`shared/` is a contract zone. Schema or persona changes require explicit human
approval and coordinated updates to producers and consumers.

## Primary data flows

### Save and ingest a practice session

1. GPT-Live completes conversation, interactive summary, and shadowing.
2. The user requests “Save today's session.”
3. ChatGPT emits exactly one schema-v1 JSON payload without inventing unknown
   values; unknown scalar values use `null` and unknown collections use `[]`.
4. The user sends the JSON to Hermes through Telegram.
5. Hermes validates against the committed JSON Schema and runs semantic checks.
6. Hermes performs one transactional, idempotent ingest into Supabase.
7. Hermes confirms the inserted session, items, and mistakes in Telegram.

### Read data in the dashboard

1. The static SPA restores a Supabase email/password session or shows login.
2. `supabase-js` sends the public anon key plus the user's JWT.
3. Row Level Security restricts every query to `user_id = auth.uid()`.
4. The dashboard renders base-table data and the approved aggregate views.

### Run a scheduled review

1. Hermes reads the user's timezone, schedule, and question count from
   `user_settings`; schedules are not hard-coded.
2. It selects due items plus recent, mistake-related, and focus candidates while
   avoiding the same item/question-type pair for 14 days.
3. Hermes asks 3–5 questions sequentially in Telegram and evaluates answers.
4. Each result appends a `review_events` row and advances SRS state.
5. The web review uses the same persistence contract but is locally generated
   and self-graded; the browser never calls an LLM.

### Generate a weekly report

Hermes computes weekly metrics from Supabase, upserts one `weekly_reports` row,
sends a compact Telegram summary, and leaves the full report for the dashboard.

## Component responsibilities

### Dashboard (`apps/dashboard`)

- React 18, TypeScript, Vite, Tailwind CSS, React Router, and Recharts.
- Uses `HashRouter` and Vite base `/english-companion-os/` for GitHub Pages.
- Contains no backend, service-role credential, or LLM request.
- Uses Supabase Auth persistence and RLS-protected queries.
- Supports mobile bottom navigation and desktop sidebar navigation.

### Supabase (`supabase`)

- PostgreSQL is the authoritative structured store.
- Numbered SQL migrations define tables, views, functions, constraints, and RLS.
- Every user-owned table carries `user_id`; every table has RLS enabled.
- `apply_review_rating()` owns the authenticated web SRS transition.
- Seed data is development-only and uses a real configured auth user UUID.

### Hermes (`hermes/skills/english-learning`)

- Node.js and TypeScript package integrated through Hermes' native skill model.
- Uses Ajv for schema validation and Supabase's service-role key server-side.
- Owns transactional ingestion, Telegram review generation/scoring, scheduling,
  and weekly report generation.
- Reuses Hermes' existing LLM configuration; no additional model key is added.

## Delivery order

Work follows the phases in `CODEX_HANDOFF.md`: contracts and documentation,
database foundation, dashboard, Hermes ingestion, review flows, then reporting
and polish. Database security precedes any client that reads production data.

## Explicitly out of scope for V1

- ChatGPT scraping, browser extensions, or a replacement voice stack
- LLM calls or secret credentials in the dashboard
- LINE integration, payments, gamification, native apps, or SaaS/multi-user UX
- Microservices or monorepo workspace tooling
- Weakening RLS to accommodate an incorrect client query
