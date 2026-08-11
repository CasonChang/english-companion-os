import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { EmptyState } from "../components/EmptyState";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { PageHeader } from "../components/PageHeader";
import { loadMistakeStats, type MistakeCategoryStat } from "../lib/mistakes";

const label = (value: string) => value.replace(/_/g, " ");
const trend = { improving: { icon: "↓", text: "Improving", style: "text-emerald-700 bg-emerald-50 dark:text-mint dark:bg-emerald-950/40" }, flat: { icon: "→", text: "Flat", style: "text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-white/10" }, growing: { icon: "↑", text: "Growing", style: "text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950/30" } } as const;

export function MistakesPage() {
  const [stats, setStats] = useState<MistakeCategoryStat[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; void loadMistakeStats().then((rows) => active && setStats(rows)).catch(() => active && setError("We couldn’t load mistake trends.")); return () => { active = false; }; }, []);
  const max = Math.max(1, ...(stats ?? []).map((row) => row.total_count));
  return <><PageHeader eyebrow="Patterns over time" title="Mistakes" description="Not a scorecard — a practical map of what deserves another chance in conversation."/>{error ? <EmptyState icon="↻" title="Trends couldn’t load" description={error}/> : !stats ? <LoadingSkeleton/> : stats.length === 0 ? <EmptyState title="No mistake patterns yet" description="Corrections from future sessions will collect here."/> : <section className="mt-7 space-y-3">{stats.map((row) => { const indicator = trend[row.trend]; return <Link key={row.category} to={`/mistakes/${row.category}`} className="group grid gap-4 rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card sm:grid-cols-[13rem_1fr_auto] sm:items-center dark:border-white/10 dark:bg-white/5"><div><h2 className="font-semibold capitalize">{label(row.category)}</h2><p className="mt-1 text-xs text-slate-400">{row.total_count} total · {row.last_30_days_count} recent</p></div><div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"><div className="h-full rounded-full bg-coral transition-all" style={{ width: `${Math.max(8, row.total_count / max * 100)}%` }}/></div><span className={`justify-self-start rounded-full px-3 py-1.5 text-xs font-bold sm:justify-self-end ${indicator.style}`}>{indicator.icon} {indicator.text}</span></Link>; })}</section>}</>;
}
