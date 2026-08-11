# Hermes English Learning skill

TypeScript package implementing English Companion's Hermes-side capabilities.
T3.1 provides strict JSON parsing, shared-schema validation, semantic date/text
checks, and Telegram-friendly error messages. Transactional Supabase ingestion
is added in T3.2.

## Host environment

Copy `.env.example` into the Hermes secret store and provide all three values.
`SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the browser or committed.

## Package checks

- `npm test`
- `npm run build`
