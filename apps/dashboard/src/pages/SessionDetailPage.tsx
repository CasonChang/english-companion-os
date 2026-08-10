import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";

import { EmptyState } from "../components/EmptyState";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { loadSession, type SessionDetail } from "../lib/sessions";

function Section({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-white/10 dark:bg-white/5"><div className="mb-5 flex items-center gap-2"><h2 className="text-lg font-semibold">{title}</h2>{count !== undefined && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-white/10">{count}</span>}</div>{children}</section>;
}

const label = (value: string) => value.replace(/_/g, " ");

export function SessionDetailPage() {
  const { id = "" } = useParams();
  const [session, setSession] = useState<SessionDetail | null | undefined>();
  const [error, setError] = useState("");
  useEffect(() => { let active = true; void loadSession(id).then((row) => active && setSession(row)).catch(() => active && setError("We couldn’t load this session.")); return () => { active = false; }; }, [id]);

  if (error) return <EmptyState icon="↻" title="Session couldn’t load" description={error}/>;
  if (session === undefined) return <LoadingSkeleton/>;
  if (session === null) return <EmptyState title="Session not found" description="It may have been removed or belongs to another account."/>;

  const learned = session.session_learning_items.map((row) => row.learning_items);
  const corrections = session.mistakes.filter((mistake) => !mistake.is_recurring);
  const recurring = session.mistakes.filter((mistake) => mistake.is_recurring);
  return <div className="space-y-4"><header><Link to="/sessions" className="text-sm font-semibold text-emerald-700 hover:underline dark:text-mint">← All sessions</Link><p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-mint">{session.session_date}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{session.topics.join(" · ")}</h1></header>
    <Section title="Summary"><p className="leading-7 text-slate-600 dark:text-slate-300">{session.summary}</p></Section>
    <Section title="Learning items" count={learned.length}><div className="grid gap-3 sm:grid-cols-2">{learned.map((item) => <article key={item.id} className="rounded-2xl bg-mist p-4 dark:bg-black/20"><div className="flex items-center justify-between gap-2"><span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-mint">{label(item.type)}</span>{item.importance === "high" && <span title="High importance">★</span>}</div><h3 className="mt-2 text-lg font-semibold">{item.text}</h3><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.meaning}</p><p className="mt-3 border-l-2 border-mint pl-3 text-sm italic text-slate-500 dark:text-slate-400">{item.example}</p>{item.note && <p className="mt-3 text-xs text-slate-500">{item.note}</p>}</article>)}</div></Section>
    <Section title="Corrections" count={corrections.length}><div className="space-y-4">{corrections.map((mistake) => <article key={mistake.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0 dark:border-white/10"><span className="rounded-full bg-coral/15 px-2.5 py-1 text-xs font-semibold text-orange-800 dark:text-coral">{label(mistake.category)}</span><p className="mt-3 text-sm text-red-700 line-through decoration-red-300 dark:text-red-300">{mistake.original}</p>{mistake.corrected && <p className="mt-1 font-medium text-emerald-800 dark:text-mint">{mistake.corrected}</p>}{mistake.explanation && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{mistake.explanation}</p>}</article>)}</div></Section>
    {recurring.length > 0 && <Section title="Recurring patterns" count={recurring.length}><div className="space-y-3">{recurring.map((mistake) => <div key={mistake.id} className="rounded-2xl bg-coral/10 p-4"><p className="text-xs font-bold uppercase text-orange-800 dark:text-coral">{label(mistake.category)}</p><p className="mt-2 font-medium">“{mistake.original}”</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{mistake.explanation}</p></div>)}</div></Section>}
    {session.pronunciation_notes.length > 0 && <Section title="Pronunciation" count={session.pronunciation_notes.length}>{session.pronunciation_notes.map((note) => <p key={note.word_or_sound}><strong>{note.word_or_sound}</strong> — {note.note}</p>)}</Section>}
    {session.shadowing.length > 0 && <Section title="Shadowing" count={session.shadowing.length}><ol className="space-y-3">{session.shadowing.map((line, index) => <li key={line} className="flex gap-3"><span className="text-sm font-bold text-emerald-700 dark:text-mint">{index + 1}</span><span>{line}</span></li>)}</ol></Section>}
    {session.next_session_focus && <section className="rounded-[1.5rem] bg-ink p-6 text-white"><p className="text-xs font-bold uppercase tracking-[0.2em] text-mint">Next focus</p><p className="mt-3 text-xl font-semibold leading-8">{session.next_session_focus}</p></section>}
  </div>;
}
