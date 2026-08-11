# Dashboard

Production: <https://casonchang.github.io/english-companion-os/>

Pushes to `main` that touch this app run tests, build, and deploy through
`.github/workflows/deploy-dashboard.yml`. The build reads its public Supabase
configuration from GitHub Actions repository variables.

Private React dashboard for English Companion OS. It is built as a static SPA
for GitHub Pages and uses Supabase Auth plus RLS for access control.

## Environment

Copy `.env.example` to `.env.local` and set the public Supabase Project URL and
anon key. Never put a service-role key in this directory or any `VITE_` variable.

## Commands

```bash
npm install
npm run dev
npm test
npm run build
```

The Vite base is `/english-companion-os/`, and routing uses `HashRouter`, so page
refreshes work on GitHub Pages.

## Authentication behavior

- Logged-out visitors render only the login route; learning-data pages never mount.
- Supabase persists and refreshes the browser session.
- Rejected credentials show a generic friendly message.
- Authenticated users are returned to their originally requested protected route.
- Signing out clears the Supabase session and returns the app to login.

## Language

The interface defaults to Traditional Chinese and offers a persistent 繁中 / EN
switch on the login screen and app shell. The preference is stored only in the
browser (`localStorage`); it does not change or translate saved learning data.
