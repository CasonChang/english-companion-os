import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { EmptyState } from "../components/EmptyState";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { PageHeader } from "../components/PageHeader";
import { loadSessions, type SessionSummary } from "../lib/sessions";

const formatDate = (date: string) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${date}T00:00:00`));

export function SessionsPage() {
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; void loadSessions().then((rows) => active && setSessions(rows)).catch(() => active && setError("We couldn’t load your sessions.")); return () => { active = false; }; }, []);

  return <><PageHeader eyebrow="Conversation archive" title="Sessions" description="Every saved conversation, with the useful language and patterns that came from it."/>{error ? <EmptyState icon="↻" title="Sessions couldn’t load" description={error}/> : !sessions ? <LoadingSkeleton/> : sessions.length === 0 ? <EmptyState title="No sessions yet" description="Go practice with your companion, then save the session JSON."/> : <section className="mt-7 space-y-3">{sessions.map((session) => <Link key={session.id} to={`/sessions/${session.id}`} className="group block rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card dark:border-white/10 dark:bg-white/5"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-mint">{formatDate(session.session_date)}</p><h2 className="mt-2 truncate text-lg font-semibold">{session.topics.join(" · ")}</h2></div><span className="text-xl text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600">→</span></div><p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{session.summary}</p><div className="mt-4 flex flex-wrap gap-2">{session.topics.slice(0, 4).map((topic) => <span key={topic} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">{topic}</span>)}</div></Link>)}</section>}</>;
}
