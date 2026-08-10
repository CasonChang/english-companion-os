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
