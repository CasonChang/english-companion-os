# English Learning Skill

Use this skill when the user sends a GPT-Live English session JSON object/file,
asks for due reviews, or asks about English-learning progress.

## Ingest contract (T3.1)

1. Pass the complete JSON text to `validateSession` before any database call.
2. If validation fails, send `result.summary` to the user verbatim. Never expose a
   stack trace and never attempt a partial write.
3. A date more than seven days from today requires explicit user confirmation.
   After confirmation, retry with `allowDateOutsideWindow: true`.
4. `duration_minutes: null` is valid. Never estimate GPT-Live duration.
5. Successful validation only means the payload is safe to pass to transactional
   ingestion; it does not itself write data.

Secrets belong only in the Hermes host environment. Never print or persist the
Supabase service-role key in chat, logs, memory, or repository files.
