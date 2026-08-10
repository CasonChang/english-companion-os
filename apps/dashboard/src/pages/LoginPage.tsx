import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../features/auth/AuthContext";
import { supabase } from "../lib/supabase";

type LocationState = { from?: string };

export function LoginPage() {
  const { loading, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && session) return <Navigate to="/" replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError("That email or password didn’t work. Please try again.");
      setSubmitting(false);
      return;
    }

    const from = (location.state as LocationState | null)?.from ?? "/";
    navigate(from, { replace: true });
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-ink px-5 py-8 text-white sm:px-8">
      <div className="login-glow login-glow-left" />
      <div className="login-glow login-glow-right" />
      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden max-w-xl lg:block">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.28em] text-mint">
            English Companion
          </p>
          <h1 className="text-balance text-6xl font-semibold leading-[1.04] tracking-[-0.045em]">
            Your English,
            <span className="block text-coral">growing with you.</span>
          </h1>
          <p className="mt-7 max-w-lg text-lg leading-8 text-slate-300">
            A quiet home for every conversation, useful expression, and small win along the way.
          </p>
          <div className="mt-12 flex items-center gap-4 text-sm text-slate-400">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5 text-xl">✦</span>
            Private by design · Built around your real conversations
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-mint text-xl text-ink">✦</div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-mint">English Companion</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Welcome back.</h1>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-card backdrop-blur-xl sm:p-9">
            <div className="mb-8 hidden lg:block">
              <p className="text-sm font-medium text-mint">Your private learning space</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Welcome back</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">Sign in to pick up where you left off.</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-slate-200">
                Email
                <input
                  className="field"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </label>
              <label className="block text-sm font-medium text-slate-200">
                Password
                <input
                  className="field"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Your password"
                />
              </label>

              {error && (
                <p className="rounded-xl border border-red-300/20 bg-red-300/10 px-4 py-3 text-sm text-red-100" role="alert">
                  {error}
                </p>
              )}

              <button
                className="mt-2 flex w-full items-center justify-center rounded-xl bg-mint px-5 py-3.5 font-semibold text-ink transition hover:bg-[#b8ecd4] focus:outline-none focus:ring-4 focus:ring-mint/25 disabled:cursor-wait disabled:opacity-70"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p className="mt-7 text-center text-xs leading-5 text-slate-500">
              Access is invitation-only. Your learning history stays protected by your account.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
