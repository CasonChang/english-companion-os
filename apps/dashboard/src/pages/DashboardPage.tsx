import { useState } from "react";

import { useAuth } from "../features/auth/AuthContext";

export function DashboardPage() {
  const { session, signOut } = useAuth();
  const [error, setError] = useState("");

  async function handleSignOut() {
    setError("");
    try {
      await signOut();
    } catch {
      setError("Couldn’t sign out. Please check your connection and try again.");
    }
  }

  return (
    <main className="min-h-screen bg-mist px-5 py-8 text-ink">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">English Companion</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">You’re signed in.</h1>
          </div>
          <button className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50" onClick={handleSignOut}>
            Sign out
          </button>
        </header>
        <section className="mt-12 rounded-[2rem] bg-white p-8 shadow-card">
          <p className="text-sm text-slate-500">Signed in as</p>
          <p className="mt-1 font-medium">{session?.user.email}</p>
          <h2 className="mt-10 text-2xl font-semibold">Your learning dashboard is taking shape.</h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            Authentication is ready. Your real sessions, learning items, and review queue arrive in the next dashboard steps.
          </p>
          {error && <p className="mt-5 text-sm text-red-700" role="alert">{error}</p>}
        </section>
      </div>
    </main>
  );
}
