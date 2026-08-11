# Hermes English Learning skill

TypeScript package implementing English Companion's Hermes-side capabilities.
T3.1 provides strict JSON parsing, shared-schema validation, semantic date/text
checks, and Telegram-friendly error messages. T3.2 adds atomic, idempotent Supabase ingestion through the
`ingest_english_session` database function. Apply the matching migration before
connecting this package to Hermes.

## Host environment

Copy `.env.example` into the Hermes secret store and provide all three values.
`SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the browser or committed.

## Package checks

- `npm test`
- `npm run build`

## Hermes wiring

The compiled `ecos-ingest` command accepts a JSON file path or JSON on stdin and
prints one machine-readable result line. `--confirm-date` is allowed only after
explicit user confirmation. Use `prompts/hermes-agent-setup.md` as the
copy-paste installation prompt for the existing Hermes instance.

## Portable schema

The canonical schema is mirrored at `schema/session.schema.json` so the compiled
CLI remains self-contained when deployed outside the repository. A unit test
requires this packaged copy to remain byte-equivalent in meaning to
`shared/schemas/session.schema.json`.
