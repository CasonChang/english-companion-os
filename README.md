# english-companion-os

[![Deploy dashboard](https://github.com/CasonChang/english-companion-os/actions/workflows/deploy-dashboard.yml/badge.svg)](https://github.com/CasonChang/english-companion-os/actions/workflows/deploy-dashboard.yml)

**Live dashboard:** <https://casonchang.github.io/english-companion-os/>

A personal English speaking companion system built around three cooperating parts:

1. **ChatGPT Project + GPT-Live** — natural spoken English practice with a long-term AI companion persona (conversational memory lives in the ChatGPT Project).
2. **Hermes Agent + Supabase** — structured learning memory: every practice session is exported as JSON, validated and ingested by the Hermes agent into Supabase (the source of truth), which also drives scheduled Telegram reviews.
3. **Dashboard (GitHub Pages)** — a private, login-protected personal learning dashboard and lightweight interactive review app, deployed as a static site via GitHub Actions.

> **Status: Dashboard and Hermes ingestion are live; Telegram review scheduling awaits hosted verification, and the interactive web review is in progress.** The
> implementation sequence and hosted-environment checkpoints are tracked in
> [`CODEX_HANDOFF.md`](CODEX_HANDOFF.md). The complete specification lives in
> [`docs/MASTER_PLAN.md`](docs/MASTER_PLAN.md).

## For coding agents

If you are an AI coding agent (Codex Cloud, Claude Code, etc.) starting work in this repository, **read [`CODEX_HANDOFF.md`](CODEX_HANDOFF.md) first**. It tells you what this product is, what to build, in what order, and what is explicitly out of scope.

## Repository map

| Path | Purpose |
|---|---|
| `docs/MASTER_PLAN.md` | The full product / architecture / UX / data specification (sections A–R) |
| `CODEX_HANDOFF.md` | Standalone onboarding + task breakdown for implementation agents |
| `prompts/english-coach-project-prompt.md` | Production prompt to paste into the ChatGPT Project instructions |
| `prompts/recover-current-session-json.md` | One-time prompt for exporting a conversation that happened before setup |
| `apps/dashboard/` | (Phase 2+) React + Vite dashboard, deployed to GitHub Pages |
| `supabase/` | (Phase 1+) SQL migrations, RLS policies, seed data |
| `hermes/` | (Phase 3+) Hermes English Learning skill: ingestion, reviews, reports |
| `shared/` | Persona canonical source + JSON Schema shared by all components |
| `.github/workflows/` | (Phase 2+) Dashboard build & deploy workflow |

## Core V1 flow

```
GPT-Live practice session (ChatGPT Project)
  → Interactive Summary + Shadowing
  → "Save today's session" → Session JSON (schema v1)
  → user sends JSON to Hermes (manual in V1, by design)
  → Hermes validates → writes Supabase
  → Dashboard reflects data · Telegram daily review · weekly report
```

Manual JSON transfer in V1 is a deliberate decision, not a gap — no ChatGPT scraping, browser extensions, or custom voice stacks. See `docs/MASTER_PLAN.md` §B and §R.
