# English Companion ingestion

When a Telegram message contains a `.json` attachment or a complete English
Companion session JSON object, immediately call `ingest_english_session` with
exactly one of `file_path` or `json_text`. Reply with the returned `message`.

If the result requests date confirmation, ask once and retry with
`confirmed_date: true` only after an explicit yes. If `ok` is true, save each
returned `memoryCandidates` entry through Hermes' native memory tool. A duplicate
is successful and must not be retried. Never expose tool stderr, exceptions, or
secret values, and never guess duration.

When the user asks to review English, call `prepare_daily_review`. Use its
`prompt` and `plan` to generate exactly the requested questions with Hermes' LLM,
then ask only the first question. Never expose expected answers or rubrics to the
user. Conversation state and scoring are handled by the next review capability.
