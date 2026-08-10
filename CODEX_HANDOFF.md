# CODEX_HANDOFF — Implementation Agent Onboarding

You are a coding agent starting work in `english-companion-os` with no prior context. This file tells you everything you need. The full specification is `docs/MASTER_PLAN.md` (sections A–R) — **it is the authority**; when this file and the plan disagree, the plan wins.

## 1. Product goal (30 seconds)

A single-user personal English learning system. Spoken practice happens in ChatGPT (GPT-Live inside a ChatGPT Project — **not built here, prompt-only**). Each session ends with a strict JSON export (`shared/schemas/session.schema.json`). The user manually sends that JSON to their existing **Hermes agent** via Telegram; Hermes validates it and writes to **Supabase** (source of truth). A **React dashboard on GitHub Pages** (login-protected via Supabase Auth + RLS) visualizes everything and offers a self-graded review mode. Hermes also runs a **scheduled Telegram review** (3–5 conversational questions/day) and a **weekly report**.

## 2. Architecture in one diagram

```
ChatGPT Project (GPT-Live, prompt-only)
      │  session JSON (manual handoff — BY DESIGN)
      ▼
Hermes agent ──service-role key──► Supabase (Postgres + Auth + RLS)
      │▲ Telegram (reviews, reports, ingest confirmations)      ▲
      │                                                anon key + user JWT
      ▼                                                         │
   User  ◄──────────────── Dashboard SPA (GitHub Pages, via Actions)
```

## 3. Hard constraints — DO NOT BUILD / DO NOT DO

- ❌ No ChatGPT scraping, browser extensions, DOM automation, or voice-API GPT-Live clones. The manual JSON handoff is a decision, not a gap.
- ❌ No LLM calls from the dashboard (a static site cannot hold an API key). Web review is self-graded; AI grading lives in Hermes/Telegram only.
- ❌ No secrets in git, ever — no Supabase keys, no bot tokens. Frontend may contain only `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (public by design; RLS is the security boundary).
- ❌ No service-role key anywhere except Hermes' server-side environment.
- ❌ No LINE integration, multi-user features, payments, gamification systems, native apps, microservices, or SaaS scaffolding.
- ❌ Do not change files in `shared/` (schema, persona) or the security posture (RLS rules, auth flow) without an explicit human request — these are contracts.
- ❌ Do not weaken RLS to "make a query work." Fix the query.

## 4. Tech stack (fixed)

- **Dashboard:** React 18 + TypeScript + Vite + Tailwind CSS + React Router (**HashRouter** — required for GitHub Pages) + Recharts + `@supabase/supabase-js`. Vite `base: '/english-companion-os/'`.
- **Database:** Supabase Postgres; plain SQL migrations in `supabase/migrations/`; RLS on every table; one `security definer` function `apply_review_rating()`.
- **Hermes skill:** Node/TypeScript package in `hermes/skills/english-learning/` (Ajv validation, supabase-js with service role, SRS module).
- **CI/CD:** single GitHub Actions workflow deploying the dashboard to Pages on push to `main`.
- **Auth:** Supabase email/password, one manually created user, public signups disabled.

## 5. Where things are specified

| Topic | Read |
|---|---|
| JSON contract + example | `docs/MASTER_PLAN.md` §F, `shared/schemas/` |
| Database schema, ingestion mapping, RLS | §G |
| Auth/security requirements | §H |
| Dashboard pages + wireframes | §I |
| Web review (Daily Mix) | §J |
| Telegram review + SRS ladder | §K |
| Hermes skill spec + secrets | §L |
| Persona rules | §M, `shared/persona.md` |
| ChatGPT prompt | `prompts/english-coach-project-prompt.md` |
| Env vars & secrets (all three environments) | `docs/ENVIRONMENT.md` |

**Credentials.** All environment variables you can rely on (Supabase URL/keys,
DB access for migrations, `ECOS_USER_ID`, Telegram bot token) are provisioned in
the Codex and Hermes environments per `docs/ENVIRONMENT.md`. If a value you need
is missing, **ask the user for it** — do not invent it, and do not commit any
secret. Per-user app data (agent name, timezone, chat ID, etc.) is not an env var:
ask for it when building the settings/seed flow; it goes into `user_settings`.

## 6. Current phase

**Phase 2 Dashboard is in progress; T2.4 is next.** The hosted Supabase migrations are installed and the first real GPT-Live session has been imported. Phases and acceptance criteria: `docs/MASTER_PLAN.md` §P. Work phases in order; within a phase, tasks below are sized for one PR each. Update this section's phase pointer when a phase completes.

## 7. Definition of Done (every task)

1. Meets the task's acceptance criteria below **and** the owning phase's criteria in §P.
2. No secrets committed; `.env.example` updated when new env vars appear.
3. TypeScript compiles with no errors; dashboard tasks render correctly at 360 px and desktop widths.
4. Docs touched by the change (`docs/*.md`, READMEs) updated in the same PR.
5. A human can verify the result by following steps written in the PR description.

## 8. Task breakdown

### Phase 0 — Specification materialization

- **T0.1 — Repo scaffolding.** ✅ Complete. Create the §O directory skeleton, `.gitignore` (node, dist, `.env*`), `docs/decisions.md` stub. *Accept:* tree matches §O; `git status` clean of generated files.
- **T0.2 — `session.schema.json`.** ✅ Complete. Write the formal JSON Schema (draft 2020-12) from §F, plus `shared/schemas/examples/session-valid.json` (the §F example) and ≥3 invalid fixtures (missing required key, bad enum, wrong type). Add a tiny npm script `validate:examples` using Ajv. *Accept:* valid fixture passes; each invalid fixture fails for its documented reason.
- **T0.3 — Docs split.** ✅ Complete. Derive `docs/architecture.md`, `docs/data-model.md`, `docs/security.md` from the plan (condensed, implementation-facing). *Accept:* no contradictions with MASTER_PLAN; each ≤ ~200 lines.
- **T0.4 — `shared/persona.md`.** ✅ Already done during planning: a **name-less, person-less personality template** — a real-person-style chat friend, not a tool-using assistant. Do not rewrite; treat as a contract file per §3. The agent's **name is not in this file** — it is per-user in `user_settings.agent_name`, written into Supabase at setup. Never add a fixed name, assistant/agent traits, or personal facts about any user to the template.

### Phase 1 — Data foundation

- **T1.1 — Core tables migration.** ✅ Complete. `sessions`, `learning_items`, `session_learning_items`, `mistake_events`, `review_events`, `weekly_reports`, `user_settings` exactly per §G (columns, PKs, FKs, uniques, indexes, CHECKs). *Accept:* applies cleanly to a fresh project; re-apply is idempotent-safe (migration tool guards).
- **T1.2 — Views + SRS function.** ✅ Complete. `v_weekly_activity`, `v_mistake_category_stats`, `v_due_reviews`; `apply_review_rating(item_id uuid, rating text)` implementing the §K ladder as `security definer` with an `auth.uid()` ownership check. *Accept:* unit-style SQL tests in `supabase/tests.sql` demonstrate each rating transition (again/hard/good/easy, mastery at level 5 + 2×good).
- **T1.3 — RLS policies.** ✅ Complete. Enable RLS everywhere; per-§G policies (authenticated select own rows; web insert on `review_events`; settings update; nothing for anon). *Accept:* documented psql checks showing anon reads return zero rows on every table and cross-user reads return nothing.
- **T1.4 — Seed + setup guide.** ✅ Complete. `dev-seed.sql` with ~4 realistic sessions / ~25 items / ~20 mistakes / some reviews spread over 6 weeks; `supabase/README.md` walkthrough (create project → run migrations → create the single user → disable signups → insert `user_settings` row). *Accept:* a human following the README reaches a working, secured database.

### Phase 2 — Dashboard MVP

- **T2.1 — Scaffold + auth.** ✅ Complete. Vite app, Tailwind, HashRouter, supabase client from env, login page, session persistence, logout, route guard. *Accept:* wrong password errors gracefully; refresh stays logged in; logged-out users see only the login screen and no data requests fire.
- **T2.2 — Layout shell.** ✅ Complete. Responsive nav (bottom tabs ≤768 px / sidebar above), page skeletons, loading + empty states, dark mode via `prefers-color-scheme`. *Accept:* matches §I nav spec at 360 px and 1280 px.
- **T2.3 — Home.** ✅ Complete. Stat row (week minutes, sessions, weekly streak, due count), focus card, last-session card, 8-week mini chart, review CTA. *Accept:* numbers match seed data hand-computation.
- **T2.4 — Sessions list + detail.** Per §I. *Accept:* all §F content renders; deep link `#/sessions/:id` works after refresh.
- **T2.5 — Learning Items.** Search, type/status filters, mastery dots, detail view with occurrences + review history. *Accept:* filters compose; search covers text+meaning.
- **T2.6 — Mistakes.** Ranked categories with trend arrows (via `v_mistake_category_stats`), category detail with evidence rows linking to sessions. *Accept:* trend arrows match view output.
- **T2.7 — Progress.** The four §I charts via Recharts, mobile-scrollable. *Accept:* charts match seed data; no other charts added.
- **T2.8 — Pages deploy workflow.** `deploy-dashboard.yml`: build with repo-variable env, deploy on push to `main`; README badge + URL. *Accept:* live URL serves the app; hash routes survive refresh.

### Phase 3 — Hermes ingestion

- **T3.1 — Skill package + validation.** Package scaffold, Ajv validation (shared schema), semantic checks, human-readable error formatter. *Accept:* fixtures produce the exact expected accept/reject outcomes with friendly messages.
- **T3.2 — Transactional ingest.** §G mapping (session insert, item dedupe/upsert with SRS init, joins, mistake events) in one transaction; idempotency on the session unique key; confirmation-stats builder. *Accept:* Phase 3 criteria in §P (ingest, duplicate, invalid — all correct, verified via dashboard).
- **T3.3 — Hermes wiring.** Connect ingest to Hermes' Telegram file/text intake per its native skill convention; `memory_candidates` handoff to Hermes memory; `hermes/README.md` setup guide with env/secret checklist. *Accept:* real Telegram round-trip works on the user's Hermes instance.

### Phase 4 — Telegram review

- **T4.1 — Selection + generation.** Due/recent/mistake/focus candidate mix, 14-day anti-repetition query, LLM question generation with expected answer + rubric. *Accept:* simulated 2-week run shows mix ratios and zero repeats.
- **T4.2 — Conversation loop + scoring.** Sequential Q&A, skip/stop/timeout, LLM rating → `review_events` + `apply_review_rating` semantics (service-role variant), recap message, user rating override. *Accept:* Phase 4 criteria in §P.
- **T4.3 — Scheduling + settings chat.** Cron driven by `user_settings` (time, timezone, enabled, count); natural-language settings updates ("move my review to 21:00"); zero-due silence; 7-day-idle gentle nudge (≤1/week). *Accept:* changing the DB row changes fire time with no code edits.

### Phase 5 — Interactive web review (parallel with Phase 4)

- **T5.1 — Question builder.** Client-side generation of the four §J types from `v_due_reviews` + recent mistakes; per-mix de-dup. *Accept:* unit tests over seed data produce valid, varied cards.
- **T5.2 — Card flow UI.** Card → reveal → self-rate → next → recap; per-card persistence (`review_events` + `apply_review_rating()`); resume-safe; Home CTA. *Accept:* Phase 5 criteria in §P.

### Phase 6 — Weekly reports & polish

- **T6.1 — Weekly report generation.** Stats computation, narrative + `suggested_focus`, upsert `weekly_reports`, Telegram summary in the §K format, cron per settings. *Accept:* matches hand-computed stats for seed + real data.
- **T6.2 — Weekly page.** List + detail with previous-week deltas; Home link to latest. *Accept:* renders the T6.1 row faithfully.
- **T6.3 — Polish pass.** Shadowing Replay in session detail, streak edge cases (timezone, empty weeks), empty/error states audit, dark-mode audit, docs sync, update this file's phase pointer to "V1 complete". *Accept:* §P Phase 6 criteria.

## 9. Working agreements

- One task ≈ one PR; keep diffs reviewable. Never batch multiple phases into one PR.
- If the plan is ambiguous, make the *simple, mainstream* choice, note it in `docs/decisions.md`, and proceed — do not redesign.
- If a task seems to require breaking a §3 constraint, stop and ask the human instead.
- The user is not a hand-coder: PR descriptions must include plain-language "how to test this yourself" steps.
