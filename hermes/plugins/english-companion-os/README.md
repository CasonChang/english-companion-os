# English Companion OS Hermes user plugin

This is a general user plugin; it does not modify the Telegram platform adapter.
Install it at `~/.hermes/plugins/english-companion-os/` (for a `/opt/data` home,
that is normally `/opt/data/.hermes/plugins/english-companion-os/`), enable it
with `hermes plugins enable english-companion-os`, and restart Hermes.

The TypeScript skill must be built at `/opt/data/skills/english-learning/`, or
`ECOS_INGEST_CLI` must point to its compiled `dist/cli.js`.
