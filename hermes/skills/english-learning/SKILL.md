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
5. Call `ingestSession` after validation. It performs exactly one atomic database
   RPC, returns a friendly confirmation, and surfaces `memoryCandidates` for the
   native Hermes memory mechanism.
6. A duplicate response is success: tell the user it was already saved and do not
   retry or create any rows manually.

Secrets belong only in the Hermes host environment. Never print or persist the
Supabase service-role key in chat, logs, memory, or repository files.
