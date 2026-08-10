# Dashboard

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
