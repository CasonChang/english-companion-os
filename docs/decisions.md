# Implementation decisions

This log records implementation decisions that clarify or deviate from
[`MASTER_PLAN.md`](MASTER_PLAN.md). The master plan remains authoritative unless
an entry here explicitly documents an approved change.

## Entry format

Each decision should include:

- **Date:** `YYYY-MM-DD`
- **Context:** the ambiguity or constraint that required a decision
- **Decision:** the approach selected
- **Consequences:** important trade-offs or follow-up work

## 2026-08-10 — Hard-rating half intervals

- **Context:** The SRS contract says Hard keeps the current level and uses half
  its interval, but does not specify how fractional days are rounded.
- **Decision:** Round half intervals up to the next whole day, with a minimum of
  one day. Level 0 also remains due in one day.
- **Consequences:** A level-3 Hard rating uses four days (half of seven rounded
  up), avoiding an unintentionally harsher three-day interval. SQL tests lock in
  this behavior.

## 2026-08-10 — Do not estimate GPT-Live speaking minutes

- **Context:** GPT-Live session exports do not reliably expose elapsed time, and
  the saved JSON does not contain the full transcript needed for a defensible
  word-count estimate.
- **Decision:** Keep `duration_minutes` nullable for future reliable sources, but
  do not guess it and do not show a minutes-based KPI when it is unknown. The
  Dashboard Home uses new items and session counts instead.
- **Consequences:** Progress reflects observable practice frequency and learning
  output. A future transcript-aware ingest may add measured/derived duration only
  if it records how the value was obtained.

## 2026-08-11 — Dashboard language

- Traditional Chinese (`zh-TW`) is the default Dashboard interface language.
- A persistent 繁中 / EN switch is available on both login and authenticated layouts.
- Learning content remains in its stored language; only product interface copy is translated.

## 2026-08-11 — Hermes integration uses a user plugin

- Do not patch the read-only bundled Telegram adapter under `/opt/hermes`.
- Register `ingest_english_session` through Hermes' general user-plugin API.
- Install under `~/.hermes/plugins/english-companion-os/` and explicitly enable
  the plugin; Telegram attachment/text intent is supplied by its bundled skill.

## 2026-08-11 — Hermes skill packages its runtime schema

- `shared/schemas/session.schema.json` remains canonical in the monorepo.
- The Hermes package carries an identical `schema/session.schema.json` runtime
  copy so `/opt/data/skills/english-learning/dist/cli.js` is independently
  deployable; a unit test prevents drift between the two copies.

## 2026-08-12 — Telegram review generation uses Hermes' host LLM

- The skill deterministically selects a balanced, 14-day-deduplicated candidate
  plan; question wording, expected answer, hint, and rubric are generated from
  that bounded plan by Hermes' active host model.
- This keeps model credentials in Hermes and makes selection independently
  testable while still producing conversational, non-template questions.
