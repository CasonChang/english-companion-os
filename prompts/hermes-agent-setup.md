# Hermes Agent setup prompt — English Companion OS

Copy everything below into your existing Hermes Agent configuration chat. Do
not paste secret values into chat.

---

Install English Companion OS as a **Hermes general user plugin**. Do not modify
`/opt/hermes` or the bundled Telegram adapter.

Source directories in the repository:

- `hermes/plugins/english-companion-os/`
- `hermes/skills/english-learning/`

1. Build the TypeScript skill with `npm ci && npm run build`, keeping its compiled
   CLI at `/opt/data/skills/english-learning/dist/cli.js`.
2. Copy the user plugin to the official user-plugin discovery path
   `~/.hermes/plugins/english-companion-os/`. If this host's home is `/opt/data`,
   that means `/opt/data/.hermes/plugins/english-companion-os/` — not
   `/opt/data/plugins/` unless this installation explicitly configures that path.
3. Run `hermes plugins enable english-companion-os`, then restart Hermes.
4. Confirm the `ingest_english_session` tool and bundled
   `english-companion-os:english-learning` skill are discovered.
5. Confirm only that `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and
   `ECOS_USER_ID` exist. Never print their values.

When Telegram delivers a `.json` attachment or complete pasted session JSON,
the skill must immediately call `ingest_english_session`. Reply with the safe
`message` returned by the tool. If the date requires confirmation, ask once and
retry with `confirmed_date: true` only after an explicit yes. When successful,
send each `memoryCandidates` value to Hermes' native memory tool. A duplicate is
a successful no-op. Never expose stderr, exceptions, environment values, or
Supabase details, and never guess `duration_minutes`.

After restart, report the plugin discovery/enable result and tell me you are
ready for one real Telegram round-trip. Do not configure review cron yet.

---
