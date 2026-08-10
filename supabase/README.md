# Supabase setup

This is the one-time database setup for English Companion OS. The user-facing
workflow uses the Supabase web console; no local command line is required.

## What this creates

- Seven RLS-protected application tables
- Weekly activity, mistake trend, and due-review views
- The ownership-checked SRS rating function
- Optional realistic development data for checking the dashboard

## 1. Create the project and login user

1. In Supabase, create a project in the region closest to you.
2. Open **Authentication → Users → Add user → Create new user**.
3. Enter the email and password that will be used to sign in to the dashboard.
4. Enable **Auto Confirm User** and create the user.
5. Copy the user's UUID; it is needed for settings and optional seed data.
6. Open **Authentication → Providers → Email** and turn off **Allow new users to
   sign up**. Keep email/password sign-in enabled.

Do not put the dashboard password or service-role key in this repository.

## 2. Install the database

Open **SQL Editor → New query**. Paste and run these files one at a time, in this
exact order:

1. `migrations/202608100001_core_tables.sql`
2. `migrations/202608100002_views_and_srs.sql`
3. `migrations/202608100003_rls.sql`

Each successful run displays **Success. No rows returned**. The scripts are
guarded and may be run again if the browser disconnects or the result is unclear.

## 3. Create personal settings

In a new SQL Editor query, replace the example UUID and values below, then run it:

```sql
insert into public.user_settings (
  user_id,
  timezone,
  agent_name,
  review_time,
  questions_per_review,
  weekly_report_day,
  weekly_report_time
)
values (
  'PASTE-YOUR-AUTH-USER-UUID',
  'Asia/Taipei',
  'Companion',
  '20:30',
  4,
  0,
  '20:00'
)
on conflict (user_id) do update set
  timezone = excluded.timezone,
  agent_name = excluded.agent_name,
  review_time = excluded.review_time,
  questions_per_review = excluded.questions_per_review,
  weekly_report_day = excluded.weekly_report_day,
  weekly_report_time = excluded.weekly_report_time;
```

- `timezone` must be an IANA name such as `Asia/Taipei`.
- `weekly_report_day` uses `0 = Sunday` through `6 = Saturday`.
- `questions_per_review` must be between 3 and 5.
- `agent_name` is the name shown by the companion; change it to your preference.

## 4. Optional dashboard sample data

This step is only for seeing a populated dashboard before real GPT-Live sessions
are ingested. Open `seed/dev-seed.sql`, replace the UUID on line 5 with the auth
user UUID, then paste and run the full file in SQL Editor.

The final result row should show:

| sessions | learning_items | mistakes | reviews |
|---:|---:|---:|---:|
| 4 | 25 | 20 | 10 |

The seed uses fixed IDs and conflict guards, so re-running it does not duplicate
the sample records. Do not install sample data if the database already contains
real learning history unless you deliberately want both datasets.

## 5. Values needed by later phases

From **Project Settings → API**, save these in the appropriate environment—not in
Git:

- Project URL and anon key: Dashboard GitHub Actions variables
- Project URL, service-role key, and auth user UUID: Hermes environment

The Telegram language-learning group ID is added later to
`user_settings.telegram_chat_id` when the Hermes review scheduler is configured.

## Troubleshooting

- **Foreign-key error while inserting settings or seed:** the UUID does not match
  a user in Authentication → Users.
- **Permission error while running setup:** run the SQL as the project owner in
  Supabase SQL Editor, not through the anon API.
- **Dashboard login fails:** confirm the user is auto-confirmed and email/password
  sign-in remains enabled.
- **Dashboard is empty after login:** this is expected until sample data or the
  first Hermes-ingested session exists.
- **Never fix a query by disabling RLS.** Capture the exact error and report it so
  the query or policy can be corrected safely.
