import { useEffect, useState, type ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState } from "../components/EmptyState";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { PageHeader } from "../components/PageHeader";
import { loadProgressData } from "../lib/progress";
const colors = ["#ef8354", "#75cfa8", "#64748b", "#8b5cf6"];
const dateLabel = (value: string) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(`${value}T00:00:00Z`));
function ChartCard({ title, question, children }: { title: string; question: string; children: ReactNode }) { return <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5"><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{question}</p><div className="mt-5 overflow-x-auto"><div className="h-64 min-w-[620px]">{children}</div></div></article>; }
export function ProgressPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof loadProgressData>> | null>(null); const [error, setError] = useState("");
  useEffect(() => { let active = true; void loadProgressData().then((value) => active && setData(value)).catch(() => active && setError("We couldn’t load your progress right now.")); return () => { active = false; }; }, []);
  if (error) return <><PageHeader eyebrow="Patterns over time" title="Progress"/><EmptyState icon="↻" title="Progress is taking a short break" description={error}/></>;
  if (!data) return <><PageHeader eyebrow="Patterns over time" title="Progress"/><LoadingSkeleton/></>;
  const common = { data: data.rows, margin: { top: 5, right: 15, left: -20, bottom: 0 } };
  return <><PageHeader eyebrow="Last 12 weeks" title="Progress" description="Four signals that help you decide what to practice next."/><section className="mt-7 grid gap-4 xl:grid-cols-2">
    <ChartCard title="Practice frequency" question="Am I practicing enough? (sessions per week)"><ResponsiveContainer><BarChart {...common}><CartesianGrid vertical={false} strokeDasharray="3 3"/><XAxis dataKey="week" tickFormatter={dateLabel}/><YAxis allowDecimals={false}/><Tooltip labelFormatter={(v) => `Week of ${dateLabel(String(v))}`}/><Bar dataKey="sessions" fill="#75cfa8" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></ChartCard>
    <ChartCard title="Review completion" question="Am I retaining? Completed reviews versus currently scheduled due dates."><ResponsiveContainer><BarChart {...common}><CartesianGrid vertical={false} strokeDasharray="3 3"/><XAxis dataKey="week" tickFormatter={dateLabel}/><YAxis allowDecimals={false}/><Tooltip/><Legend/><Bar name="Done" dataKey="reviewsDone" fill="#75cfa8" radius={[5,5,0,0]}/><Bar name="Due" dataKey="reviewsDue" fill="#ef8354" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></ChartCard>
    <ChartCard title="Mistake trend" question="Are my most common mistake categories improving?"><ResponsiveContainer><LineChart {...common}><CartesianGrid vertical={false} strokeDasharray="3 3"/><XAxis dataKey="week" tickFormatter={dateLabel}/><YAxis allowDecimals={false}/><Tooltip/><Legend/>{data.topCategories.map((category, index) => <Line key={category} type="monotone" dataKey={category} stroke={colors[index]} strokeWidth={2} dot={false} connectNulls/>)}</LineChart></ResponsiveContainer></ChartCard>
    <ChartCard title="Mastered collection" question="Is the collection growing into knowledge?"><ResponsiveContainer><LineChart {...common}><CartesianGrid vertical={false} strokeDasharray="3 3"/><XAxis dataKey="week" tickFormatter={dateLabel}/><YAxis allowDecimals={false}/><Tooltip/><Line name="Mastered" type="monotone" dataKey="mastered" stroke="#75cfa8" strokeWidth={3} dot={{ r: 3 }}/></LineChart></ResponsiveContainer></ChartCard>
  </section></>;
}
