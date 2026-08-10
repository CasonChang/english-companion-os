# Data model

Implementation reference for the Supabase schema. The canonical requirements are
in [`MASTER_PLAN.md`](MASTER_PLAN.md); migrations must remain consistent with
this document.

## Relationship overview

```text
auth.users
  ├── 1─1 user_settings
  ├── 1─* sessions ──1─* mistake_events
  │         └── *─* learning_items (through session_learning_items)
  ├── 1─* learning_items ──1─* review_events
  ├── 1─* review_events (mistake-category reviews may have no item)
  └── 1─* weekly_reports
```

Every application table is user-owned. `user_id` references `auth.users(id)` and
is also the RLS ownership boundary.

## Tables

### `sessions`

One row per imported practice session. It stores the date, optional start time
and duration, topics, summary, next focus, display-only JSON for shadowing and
pronunciation notes, memory candidates, original `raw_json`, schema version, and
source. `(user_id, session_date, coalesce(start_time, '00:00'))` is unique so a
repeated import is idempotent. Index `(user_id, session_date desc)` supports the
history pages.

### `learning_items`

One deduplicated vocabulary, phrase, phrasal verb, collocation, natural
expression, idiom, or pattern. `(user_id, type, normalized_text)` is unique,
where normalized text is trimmed and lowercased. The row preserves current
meaning, example, note, importance, first session, occurrence count, and SRS
state:

- `review_level`: integer 0–5
- `next_review_at`: next due date
- `last_reviewed_at`: last answer timestamp or null
- `consecutive_good`: mastery counter
- `status`: `active`, `mastered`, or `archived`

Indexes on `(user_id, status, next_review_at)` and `(user_id, type)` support the
due queue and filters.

### `session_learning_items`

Occurrence join between sessions and deduplicated learning items. Its composite
primary key is `(session_id, learning_item_id)`. `example_in_session` retains the
context used during that occurrence. Both foreign keys cascade on delete.

### `mistake_events`

One correction or recurring-mistake example. It stores the closed mistake
category, original wording, optional correction/explanation, and whether the
event came from `recurring_mistakes`. It belongs to a session and cascades when
that session is deleted. Category/time and session indexes serve mistake trends
and session detail.

Allowed categories are `articles`, `verb_tense`, `prepositions`, `plurals`,
`word_choice`, `word_order`, `subject_verb_agreement`, `unnatural_phrasing`,
`pronunciation`, and `other`.

### `review_events`

Append-only record of one answered Telegram or web review. Exactly one target is
set: `learning_item_id` or `mistake_category`. The row also stores channel,
question type, question, optional answer/evaluation, rating, and timestamp.
Ratings are `again`, `hard`, `good`, or `easy`; channels are `telegram` or `web`.
Indexes support item history, 14-day question de-duplication, and recent activity.

### `weekly_reports`

One report per `(user_id, week_start)`, where `week_start` is Monday. `stats`
contains computed display metrics as JSONB; `narrative` and optional
`suggested_focus` contain the readable result. Re-generation upserts this row.

### `user_settings`

One row per user, keyed by `user_id`. It contains:

- IANA timezone and companion `agent_name`
- daily review enablement, local time, and question count (3–5)
- weekly report enablement, weekday, and local time
- Telegram language-learning group chat ID
- configurable SRS intervals, defaulting to `{1,3,7,14,30}` days

These are database values, not build-time environment variables.

## Views

### `v_weekly_activity`

Weekly session and review rollup used by Home, Progress, and weekly reporting.
Time bucketing must respect the user's configured timezone where required by the
master plan.

### `v_mistake_category_stats`

Per-category counts and comparison data for Mistakes ranking and trend arrows.
The migration is responsible for producing the exact current-versus-prior
period values consumed by the UI.

### `v_due_reviews`

Active learning items whose `next_review_at` is due, enriched with the fields
needed to build review questions. Ownership remains enforceable through the
underlying user IDs and RLS rules.

## SRS transition contract

The interval ladder defaults to levels 1–5 = 1, 3, 7, 14, and 30 days.

| Rating | Level transition | Next due |
|---|---|---|
| `again` | reset to 0 | tomorrow |
| `hard` | remain at current level | half the current interval |
| `good` | advance 1, maximum 5 | new level interval |
| `easy` | advance 2, maximum 5 | new level interval |

Good and Easy increment `consecutive_good`; Again and Hard reset it. An item at
level 5 becomes mastered after two consecutive Good/Easy results. The
`apply_review_rating(item_id, rating)` database function implements this for the
authenticated web flow and must verify that `auth.uid()` owns the item before
changing it. Hermes applies equivalent semantics with its server-side role.

## Session ingestion mapping

In one transaction Hermes:

1. inserts the session and retains the original JSON;
2. normalizes and upserts each learning item, incrementing `times_seen`;
3. inserts occurrence joins with the session example;
4. inserts correction mistake events;
5. converts recurring-mistake examples into recurring mistake events;
6. returns confirmation counts.

The session uniqueness rule makes retries safe. Invalid schema or semantic data
is rejected before the transaction begins.

## Data representation rules

- Normalize fields that are filtered, joined, aggregated, or independently
  updated; retain display-only/archival structures as JSONB.
- Store the exact original session export in `sessions.raw_json`.
- Use the schema's closed enums rather than accepting arbitrary category text.
- Use `null` for unknown nullable scalar values and empty arrays for known-empty
  collections; do not infer facts that the session export did not contain.
- All timestamps use `timestamptz`; user-local scheduling uses `user_settings.timezone`.
