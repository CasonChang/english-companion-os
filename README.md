# english-companion-os

[![Deploy dashboard](https://github.com/CasonChang/english-companion-os/actions/workflows/deploy-dashboard.yml/badge.svg)](https://github.com/CasonChang/english-companion-os/actions/workflows/deploy-dashboard.yml)

**Live dashboard:** <https://casonchang.github.io/english-companion-os/>

A personal English speaking companion system built around three cooperating parts:

1. **ChatGPT Project + GPT-Live** — natural spoken English practice with a long-term AI companion persona (conversational memory lives in the ChatGPT Project).
2. **Hermes Agent + Supabase** — structured learning memory: every practice session is exported as JSON, validated and ingested by the Hermes agent into Supabase (the source of truth), which also drives scheduled Telegram reviews.
3. **Dashboard (GitHub Pages)** — a private, login-protected personal learning dashboard and lightweight interactive review app, deployed as a static site via GitHub Actions.

> **Status: V1 implementation is complete.** Dashboard, Hermes ingestion, daily reviews, weekly reports, and hosted schedule smoke checks are ready; only observation of the first real scheduled weekly report remains.
> implementation sequence and hosted-environment checkpoints are tracked in
> [`CODEX_HANDOFF.md`](CODEX_HANDOFF.md). The complete specification lives in
> [`docs/MASTER_PLAN.md`](docs/MASTER_PLAN.md).

## For coding agents

If you are an AI coding agent (Codex Cloud, Claude Code, etc.) starting work in this repository, **read [`CODEX_HANDOFF.md`](CODEX_HANDOFF.md) first**. It tells you what this product is, what to build, in what order, and what is explicitly out of scope.

### Owner workflow preferences (persistent)

- Continue with the next task in `CODEX_HANDOFF.md` without asking routine
  implementation questions. Ask only when the owner must operate Supabase or
  send a setup/test message to Hermes.
- When Supabase action is required, give the owner a **direct clickable GitHub
  link to the exact SQL file**—never ask them to browse the repository for it.
- When Hermes action is required, provide one complete copy-paste prompt and a
  direct link to its prompt file. Keep secrets out of prompts and chat.
- After checks pass, commit and push directly to `main`; do not wait for a PR or
  ask the owner to merge. If the environment cannot push, state the exact block.
- In the final response, put required owner actions in a clearly labeled,
  numbered section with links and copy-paste content.

## Repository map

| Path | Purpose |
|---|---|
| `docs/MASTER_PLAN.md` | The full product / architecture / UX / data specification (sections A–R) |
| `CODEX_HANDOFF.md` | Standalone onboarding + task breakdown for implementation agents |
| `prompts/english-coach-project-prompt.md` | Production prompt to paste into the ChatGPT Project instructions |
| `prompts/recover-current-session-json.md` | One-time prompt for exporting a conversation that happened before setup |
| `prompts/hermes-agent-weekly-report-setup.md` | Copy-paste Hermes update prompt for scheduled weekly reports |
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
