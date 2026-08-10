# Environment & Secrets

How credentials are provisioned across the system. **This file lists variable
names and where each value comes from — never actual values.** Real values are
set in each runtime's environment (Codex, Hermes) or in GitHub repo settings,
and are never committed. `.env*` is gitignored.

## Guiding rules

- **ChatGPT / GPT-Live needs no secret at all.** Practice is manual (paste the
  prompt, hand off the JSON) — there is no OpenAI API key anywhere in this system.
- **anon key = public** (safe in the frontend bundle and in GitHub). **service_role
  key = secret** (backend only: Hermes, and Codex for testing). They are never
  interchangeable and the service_role key must never reach the browser, the repo,
  or git.
- **Hermes' LLM** (used to generate/score reviews) reuses Hermes' existing model
  configuration — this project adds no separate LLM key.

---

## Values you must obtain first (the sources)

Get these once, then paste them into the environments below.

| # | Value | Where to get it | Sensitivity |
|---|---|---|---|
| 1 | Supabase **Project URL** | Supabase → Project Settings → API | public |
| 2 | Supabase **anon public key** | Supabase → Project Settings → API | public |
| 3 | Supabase **service_role key** | Supabase → Project Settings → API | **secret** |
| 4 | Supabase **Project ref** | Supabase → Project Settings → General | low |
| 5 | Supabase **DB password** | you set it when creating the project | **secret** |
| 6 | Supabase **Access Token** | Supabase → Account → Access Tokens (for the CLI) | **secret** |
| 7 | Your **auth user UUID** | create one email/password user in Supabase → Auth, copy its UUID | low |
| 8 | **Telegram bot token** | reuse your existing Hermes bot (BotFather) | **secret** |
| 9 | **Telegram review chat ID** | the dedicated language-learning group's chat ID | low → set later (see below) |

Notes:
- **#7 (auth user):** creating the login account is infrastructure, not persona
  data — do it now so RLS has an owner and Hermes has a `user_id` to stamp. Its
  password is what you'll use to log into the dashboard.
- **#8 (Telegram bot):** no new bot needed — the same Hermes bot posts to a new,
  dedicated group. Just add that bot to the group.
- **#9 (chat ID):** this is app data, not a boot secret — it lives in
  `user_settings.telegram_chat_id` and can be filled when Codex asks (Phase 4).

---

## 1. Codex Cloud environment (development / testing / deploy)

Set these in the Codex Cloud environment **before** starting, so no mid-run
env change forces a session restart.

| Variable | From | Sensitivity | Used for |
|---|---|---|---|
| `VITE_SUPABASE_URL` | value #1 | public | dashboard dev/build (Vite requires the `VITE_` prefix) |
| `VITE_SUPABASE_ANON_KEY` | value #2 | public | dashboard dev/build |
| `SUPABASE_SERVICE_ROLE_KEY` | value #3 | **secret** | testing ingestion/write logic (Hermes skill) |
| `SUPABASE_ACCESS_TOKEN` | value #6 | **secret** | Supabase CLI to apply migrations (`supabase db push`) |
| `SUPABASE_PROJECT_REF` | value #4 | low | Supabase CLI target |
| `SUPABASE_DB_PASSWORD` | value #5 | **secret** | Supabase CLI DB connection |
| `ECOS_USER_ID` | value #7 | low | seed/test rows owned by your user |

> Backend scripts read the URL/anon value from the same values as the `VITE_`
> vars; if a non-prefixed `SUPABASE_URL` / `SUPABASE_ANON_KEY` is also needed,
> set them to the same values. Codex handles the wiring.

**Security note.** `SUPABASE_SERVICE_ROLE_KEY` grants full DB access. Giving it to
a cloud agent is acceptable for a solo V1, but: keep it out of the repo, and you
can **rotate it in Supabase anytime** (Project Settings → API → roll key) once the
build is done. If you prefer stronger isolation, create a separate dev Supabase
project for Codex and keep production keys elsewhere — not required for V1.

## 2. Hermes agent environment (long-running)

Set these wherever Hermes stores its secrets (its host env / secret store).

| Variable | From | Sensitivity | Used for |
|---|---|---|---|
| `SUPABASE_URL` | value #1 | public | Supabase endpoint |
| `SUPABASE_SERVICE_ROLE_KEY` | value #3 | **secret** | validated writes (bypasses RLS) |
| `ECOS_USER_ID` | value #7 | low | the `user_id` stamped on every row |
| `TELEGRAM_BOT_TOKEN` | value #8 | **secret** | sending/receiving review messages |

Hermes' existing LLM credentials are reused as-is — nothing to add here.

## 3. GitHub repository (Actions → build & deploy the dashboard)

Set as **Variables** (not Secrets — these are public), under
Settings → Secrets and variables → Actions → *Variables*:

| Variable | From | Used for |
|---|---|---|
| `VITE_SUPABASE_URL` | value #1 | injected at build time into the static site |
| `VITE_SUPABASE_ANON_KEY` | value #2 | injected at build time into the static site |

GitHub Actions' built-in `GITHUB_TOKEN` handles the Pages deploy — you provide nothing for that.

---

## Set now vs. answer when Codex asks

**Set now (infrastructure credentials — the tables above):** everything in
sections 1–3. These require only creating the Supabase project, one auth user,
and reusing the Hermes bot — no personal/persona data.

**Answer later (per-user app data, written into `user_settings` — not env vars):**
the companion's name (`agent_name`), how you're addressed, pronouns, timezone,
daily `review_time`, `telegram_chat_id`, `srs_intervals`, report schedule. Codex
will ask for these when it builds the settings flow / seed; they are rows in the
database, never environment variables, and never stored in the repo.
