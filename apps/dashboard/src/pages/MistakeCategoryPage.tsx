import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { EmptyState } from "../components/EmptyState";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { groupMistakesByMonth, loadMistakeCategory, type MistakeCategoryStat, type MistakeEvidence } from "../lib/mistakes";

const label = (value: string) => value.replace(/_/g, " ");
const formatDate = (value: string) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

export function MistakeCategoryPage() {
  const { category = "" } = useParams();
  const [data, setData] = useState<{ stats: MistakeCategoryStat | null; events: MistakeEvidence[] } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; void loadMistakeCategory(category).then((result) => active && setData(result)).catch(() => active && setError("We couldn’t load this mistake category.")); return () => { active = false; }; }, [category]);
  if (error) return <EmptyState icon="↻" title="Category couldn’t load" description={error}/>;
  if (!data) return <LoadingSkeleton/>;
  if (!data.stats) return <EmptyState title="Category not found" description="There is no evidence for this category yet."/>;
  const recurringDescription = data.events.find((event) => event.is_recurring)?.explanation;
  const monthly = groupMistakesByMonth(data.events);
  return <div className="space-y-4"><header><Link to="/mistakes" className="text-sm font-semibold text-emerald-700 hover:underline dark:text-mint">← Mistakes</Link><p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-coral">Pattern detail</p><h1 className="mt-2 text-4xl font-semibold capitalize tracking-tight">{label(category)}</h1>{recurringDescription && <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">{recurringDescription}</p>}</header>
    <section className="grid gap-3 sm:grid-cols-3">{[["All time",data.stats.total_count],["Last 30 days",data.stats.last_30_days_count],["Previous 30 days",data.stats.previous_30_days_count]].map(([name,value]) => <article key={String(name)} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{name}</p><p className="mt-2 text-3xl font-semibold">{value}</p></article>)}</section>
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5"><h2 className="font-semibold">Monthly occurrences</h2><div className="mt-5 h-44 min-w-[320px] overflow-x-auto"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthly}><XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11}/><YAxis allowDecimals={false} width={24} tickLine={false} axisLine={false}/><Tooltip/><Bar dataKey="count" fill="#ff9776" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div></section>
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5"><h2 className="text-lg font-semibold">Real evidence <span className="ml-1 text-sm text-slate-400">{data.events.length}</span></h2><div className="mt-5 space-y-4">{data.events.map((event) => <article key={event.id} className="border-b border-slate-100 pb-4 last:border-0 dark:border-white/10"><div className="flex flex-wrap items-center justify-between gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${event.is_recurring ? "bg-coral/15 text-orange-800 dark:text-coral" : "bg-slate-100 text-slate-500 dark:bg-white/10"}`}>{event.is_recurring ? "Recurring evidence" : "Correction"}</span><Link to={`/sessions/${event.sessions.id}`} className="text-xs font-semibold text-emerald-700 hover:underline dark:text-mint">{formatDate(event.sessions.session_date)} → session</Link></div><p className="mt-3 text-sm text-red-700 line-through decoration-red-300 dark:text-red-300">{event.original}</p>{event.corrected && <p className="mt-1 font-medium text-emerald-800 dark:text-mint">{event.corrected}</p>}{event.explanation && !event.is_recurring && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{event.explanation}</p>}</article>)}</div></section>
  </div>;
}
