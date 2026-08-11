# Hermes Agent setup prompt — English Companion OS

Copy everything below into your existing Hermes Agent configuration chat.
Replace no values in the prompt; the required secrets must already exist in the
Hermes host secret store, never in chat.

---

Install and use the `english-learning` skill from this repository:

`hermes/skills/english-learning/`

Read its `SKILL.md` first and follow it as the authority. Build the package with
`npm ci && npm run build`. Register `dist/cli.js` as the handler for English
session JSON received as either a Telegram `.json` attachment or pasted JSON.

For each incoming session:

1. Pass the downloaded file path to `ecos-ingest <path>`, or pipe pasted text to
   `ecos-ingest` over stdin.
2. Parse the command's one-line JSON result.
3. Reply to the user with `message` exactly. Never expose stderr, a stack trace,
   environment values, or Supabase error details.
4. When `ok` is true, send every `memoryCandidates` entry to Hermes' native
   long-term-memory mechanism. Do not store those candidates anywhere else.
5. When the result says the date needs confirmation, ask the user. Only after an
   explicit yes, retry once with `--confirm-date`.
6. A duplicate is a successful no-op. Do not retry or manually insert rows.
7. Never guess `duration_minutes`; `null` is correct for GPT-Live.

Required host environment names are `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, and `ECOS_USER_ID`. Confirm only that they exist;
never print their values. The service-role key must not enter Telegram, logs,
memory, GitHub, or a browser.

After installation, tell me you are ready for one real round-trip test. Do not
configure review cron yet; ingestion must pass first.

---
