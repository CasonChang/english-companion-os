# GitHub Pages deployment

The Dashboard deploy workflow is ready in `docs/deploy-dashboard.workflow.yml`.
It tests and builds `apps/dashboard`, reads `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` from GitHub Actions repository variables, and deploys
the build artifact to Pages.

It must be moved to `.github/workflows/deploy-dashboard.yml` before it can run.
The repository automation account currently cannot make that move because its
GitHub personal access token does not have permission to create workflow files.
Once workflow-write access is available, move the file, merge it to `main`, and
verify both the Actions run and `https://casonchang.github.io/english-companion-os/`.

Never replace the anon key with the Supabase service-role key.
