# English Companion OS Hermes user plugin

This is a general user plugin; it does not modify the Telegram platform adapter.
Install it at `~/.hermes/plugins/english-companion-os/` (for a `/opt/data` home,
that is normally `/opt/data/.hermes/plugins/english-companion-os/`), enable it
with `hermes plugins enable english-companion-os`, and restart Hermes.

The TypeScript skill must be built at `/opt/data/skills/english-learning/`, or
`ECOS_INGEST_CLI` must point to its compiled `dist/cli.js`.

## Cron

Configure the Hermes host scheduler to invoke `review_schedule_tick` every 15
minutes. The database owns the actual local time, timezone, enabled state,
duplicate claim, idle-nudge throttle, and question count, so the host cron must
not hard-code a daily time.

The same scheduler should invoke `weekly_report_tick` every 15 minutes. Send
nothing when its returned `message` is null; otherwise send that message to the
configured learning chat. The database owns the weekly weekday, time, timezone,
and duplicate claim.
