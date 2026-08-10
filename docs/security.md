# Security

Implementation checklist for authentication, authorization, and secret handling.
The canonical requirements remain in [`MASTER_PLAN.md`](MASTER_PLAN.md).

## Trust boundaries

| Component | Credential | Trust level |
|---|---|---|
| Dashboard | Supabase anon key + signed-in user JWT | Untrusted public client |
| Hermes | Supabase service-role key | Trusted server-side process |
| GitHub Actions | Public Vite variables + built-in `GITHUB_TOKEN` | Build/deploy environment |
| ChatGPT Project | None | Manual producer of session JSON |

The Supabase URL and anon key are public identifiers. They do not authorize
private reads by themselves; Row Level Security and the authenticated JWT are
the browser security boundary. The service-role key bypasses RLS and must never
be exposed to the dashboard, committed to Git, pasted into logs, or sent in chat.

## Authentication design

- Use Supabase email/password authentication.
- Create one user manually and disable public signups.
- Persist the browser session through `supabase-js`.
- Logged-out visitors see only the login screen; protected page components and
  data queries must not run before authentication succeeds.
- Incorrect credentials produce a generic, user-friendly error without revealing
  account existence or internal response details.
- Logout clears the local session and returns to login.

Authentication establishes identity; RLS authorizes each database operation.
A client-side route guard is UX, not a substitute for database authorization.

## Row Level Security

Enable RLS on every application table and keep it enabled for all future tables.

### Authenticated browser access

- `SELECT`: only rows where `user_id = auth.uid()`.
- `review_events INSERT`: allowed only when the inserted `user_id` is
  `auth.uid()` and referenced learning items are owned by that user.
- `user_settings UPDATE`: only the signed-in user's row.
- SRS changes: only through `apply_review_rating()`, which independently checks
  item ownership.
- Do not grant browser writes that are not required by the documented dashboard
  flows.

### Anonymous and cross-user access

- The anon role without a user JWT receives no application rows.
- An authenticated user receives no rows owned by another user.
- Policies must use both `USING` and `WITH CHECK` where the operation requires
  read and write ownership constraints.
- Never weaken a policy to make a frontend query succeed; correct the query or
  database function instead.

### Trusted Hermes access

Hermes uses the service-role key server-side for validated ingestion and
scheduled jobs. Every inserted row still receives the configured `ECOS_USER_ID`
so ownership is explicit and future migrations remain safe.

## Security-definer function

`apply_review_rating(item_id uuid, rating text)` is the one approved
`security definer` function for authenticated web SRS updates. Its migration must:

1. set a safe, explicit `search_path`;
2. reject ratings outside `again`, `hard`, `good`, and `easy`;
3. select the item only when `user_id = auth.uid()`;
4. fail without revealing another user's item details;
5. update only the intended SRS fields;
6. grant execute only to the required authenticated role.

Do not introduce additional security-definer functions without documenting the
reason and reviewing their ownership checks and execution grants.

## Secret handling

### Permitted public frontend values

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

These may be GitHub Actions repository **Variables** and are compiled into the
static bundle. No other credential belongs in a `VITE_` variable.

### Server-side or development secrets

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `TELEGRAM_BOT_TOKEN`
- existing Hermes LLM credentials

Keep these only in Codex/Hermes environment secret stores. Rotate a credential
immediately if it appears in Git history, logs, screenshots, or messages.

Low-sensitivity configuration such as `SUPABASE_PROJECT_REF` and `ECOS_USER_ID`
still belongs in the environment rather than source files. Per-user settings
such as timezone, agent name, review time, and Telegram chat ID belong in the
`user_settings` database row.

## Repository safeguards

- `.env` and `.env.*` are ignored; only `.env.example` may be committed.
- Example environment files contain variable names and placeholders, never real
  values.
- Do not commit Supabase local state, database dumps containing user data, build
  output, Telegram payload logs, or captured auth sessions.
- Review staged changes and history for secrets before every push.
- Frontend source, source maps, and network requests must contain no service-role
  key, bot token, database password, or LLM key.

## Validation and ingestion safety

- Validate every session payload against the committed JSON Schema with Ajv.
- Reject missing required fields, wrong types, unknown schema versions, and
  semantic inconsistencies before writing anything.
- Unknown top-level keys may be warned about and ignored for forward
  compatibility; preserve the original payload in `sessions.raw_json`.
- Ingestion is transactional and idempotent so partial or repeated imports do not
  corrupt learning state.
- Display user/session text as text; do not render untrusted values as raw HTML.

## Deployment checklist

### Supabase

- [ ] Create the single auth user and disable public signups.
- [ ] Apply migrations to a fresh project without errors.
- [ ] Confirm RLS is enabled on every application table.
- [ ] Confirm unauthenticated reads return zero rows on every table and view.
- [ ] Confirm authenticated reads return only the owner's rows.
- [ ] Confirm cross-user reads and writes fail.
- [ ] Confirm the service role can perform the documented Hermes writes.
- [ ] Test all SRS rating transitions and function ownership checks.

### Dashboard and GitHub Pages

- [ ] Store only the two public Vite values as repository Variables.
- [ ] Confirm logged-out loads issue no application-data queries.
- [ ] Confirm refresh preserves a valid login and logout removes it.
- [ ] Inspect the production bundle for prohibited credentials.

### Hermes

- [ ] Load secrets from the runtime environment, not checked-in files.
- [ ] Validate payloads before database calls.
- [ ] Stamp every inserted row with the configured user ID.
- [ ] Avoid logging full credentials, auth headers, or unnecessary personal data.
- [ ] Restrict Telegram review handling to the configured learning chat.

See [`ENVIRONMENT.md`](ENVIRONMENT.md) for the complete provisioning map.
