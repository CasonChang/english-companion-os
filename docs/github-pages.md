# GitHub Pages deployment

The Dashboard is deployed by `.github/workflows/deploy-dashboard.yml`. It tests
and builds `apps/dashboard`, reads `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` from GitHub Actions repository variables, and deploys
the build artifact to Pages.

Production URL: <https://casonchang.github.io/english-companion-os/>

Never replace the anon key with the Supabase service-role key.
