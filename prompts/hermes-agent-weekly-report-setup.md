# Hermes Agent update prompt — weekly reports

Copy everything below into the existing Hermes Agent configuration chat. Do
not paste any secret values into chat.

---

Update the installed English Companion OS from the repository's latest `main`
branch and finish the weekly-report setup. Do not modify `/opt/hermes` or the
bundled Telegram adapter.

1. Pull `https://github.com/CasonChang/english-companion-os` at `main`.
2. In `hermes/skills/english-learning`, run `npm ci`, `npm test`, and
   `npm run build`. Install/copy that built skill at
   `/opt/data/skills/english-learning/` so this file exists:
   `/opt/data/skills/english-learning/dist/weekly-report-cli.js`.
3. Copy `hermes/plugins/english-companion-os/` to the official user-plugin path
   `~/.hermes/plugins/english-companion-os/` (normally
   `/opt/data/.hermes/plugins/english-companion-os/`). Enable the plugin and
   restart Hermes.
4. Confirm the `weekly_report_tick` tool is discovered. Confirm only that
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ECOS_USER_ID`, and
   `ECOS_DASHBOARD_URL` exist; never print their values. If
   `ECOS_DASHBOARD_URL` is missing, set it in the host secret/environment store
   to `https://casonchang.github.io/english-companion-os`—do not paste secrets
   into this chat.
5. Add `weekly_report_tick` to the same host scheduler that runs every 15
   minutes. Do not hard-code Sunday or a clock time: Supabase `user_settings`
   owns the enabled flag, weekday, local time, timezone, and duplicate claim.
6. On each tick, call `weekly_report_tick`. When its returned `message` is null,
   send nothing. When it contains a message, send that message unchanged to the
   dedicated English-learning Telegram chat. Never expose stdout/stderr,
   exceptions, environment values, or Supabase details.
7. Run one safe discovery/smoke check, but do not force a real report outside
   its configured schedule and do not alter production report rows just to test.

Reply with a short checklist showing: pulled commit, build/tests, plugin path,
`weekly_report_tick` discovery, scheduler registration, and whether the four
environment variable names exist. Do not include any environment values.

---
