import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { EmptyState } from "../components/EmptyState";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { MasteryDots } from "../components/MasteryDots";
import { PageHeader } from "../components/PageHeader";
import { filterLearningItems } from "../lib/itemFilters";
import { loadLearningItems, type LearningItemRow } from "../lib/items";

const label = (value: string) => value.replace(/_/g, " ");

export function LearningItemsPage() {
  const [items, setItems] = useState<LearningItemRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");
  useEffect(() => { let active = true; void loadLearningItems().then((rows) => active && setItems(rows)).catch(() => active && setError("We couldn’t load your learning items.")); return () => { active = false; }; }, []);
  const types = useMemo(() => [...new Set((items ?? []).map((item) => item.type))].sort(), [items]);
  const filtered = useMemo(() => filterLearningItems(items ?? [], { search, type, status }), [items, search, type, status]);

  return <><PageHeader eyebrow="Your collection" title="Learning items" description="The words, expressions, and patterns worth bringing into your own English."/>
    <section className="mt-7 grid gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_auto_auto] dark:border-white/10 dark:bg-white/5">
      <label className="relative"><span className="sr-only">Search learning items</span><span className="pointer-events-none absolute left-3 top-3 text-slate-400">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-mist py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-400 dark:border-white/10 dark:bg-black/20" placeholder="Search text or meaning…"/></label>
      <label><span className="sr-only">Filter by type</span><select value={type} onChange={(event) => setType(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-mist px-3 py-2.5 text-sm dark:border-white/10 dark:bg-[#101b29]"><option value="all">All types</option>{types.map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label>
      <label><span className="sr-only">Filter by status</span><select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-mist px-3 py-2.5 text-sm dark:border-white/10 dark:bg-[#101b29]"><option value="all">All status</option><option value="active">Active</option><option value="mastered">Mastered</option><option value="archived">Archived</option></select></label>
    </section>
    {error ? <EmptyState icon="↻" title="Items couldn’t load" description={error}/> : !items ? <LoadingSkeleton/> : items.length === 0 ? <EmptyState title="No learning items yet" description="Useful language from saved GPT-Live sessions will collect here."/> : filtered.length === 0 ? <EmptyState icon="⌕" title="No matching items" description="Try a different search or clear one of the filters."/> : <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => <Link key={item.id} to={`/items/${item.id}`} className="group rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card dark:border-white/10 dark:bg-white/5"><div className="flex items-center justify-between gap-3"><span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-mint">{label(item.type)}</span><MasteryDots level={item.review_level} status={item.status}/></div><h2 className="mt-4 text-xl font-semibold group-hover:text-emerald-700 dark:group-hover:text-mint">{item.text}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{item.meaning}</p><div className="mt-5 flex items-center justify-between text-xs text-slate-400"><span className="capitalize">{item.status}</span><span>Seen {item.times_seen}×</span></div></Link>)}</section>}
  </>;
}
