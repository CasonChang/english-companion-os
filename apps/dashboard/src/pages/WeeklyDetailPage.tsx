import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { PageHeader } from "../components/PageHeader";
import { useI18n } from "../features/i18n/I18nProvider";
import { loadWeeklyReport, weeklyDelta, type WeeklyReportRow } from "../lib/weeklyReports";

const delta = (value: number) => value === 0 ? "—" : `${value > 0 ? "+" : ""}${value}`;
const label = (value: string) => value.replace(/_/g, " ");

export function WeeklyDetailPage() {
  const { weekStart = "" } = useParams();
  const { locale } = useI18n();
  const [data, setData] = useState<{ report: WeeklyReportRow | null; previous: WeeklyReportRow | null } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; void loadWeeklyReport(weekStart).then((value) => active && setData(value)).catch(() => active && setError("We couldn’t load this report.")); return () => { active = false; }; }, [weekStart]);
  const difference = useMemo(() => data?.report ? weeklyDelta(data.report, data.previous) : null, [data]);
  if (error) return <EmptyState icon="↻" title="Report couldn’t load" description={error}/>;
  if (!data) return <LoadingSkeleton/>;
  if (!data.report) return <EmptyState title={locale === "zh-TW" ? "找不到這份週報" : "Report not found"} description={locale === "zh-TW" ? "這個星期可能還沒有產生週報。" : "A report may not have been generated for this week."} action={<Link to="/weekly" className="font-semibold text-emerald-700 dark:text-mint">← {locale === "zh-TW" ? "返回週報" : "Back to Weekly"}</Link>}/>;
  const { report } = data;
  const cards = [["Speaking", report.stats.minutes ?? 0, "min", difference?.minutes], ["Sessions", report.stats.sessions ?? 0, "", difference?.sessions], ["New items", report.stats.new_items ?? 0, "", difference?.newItems], ["Reviews", report.stats.reviews_done ?? 0, ` / ${report.stats.reviews_due ?? 0}`, difference?.reviewsDone]] as const;
  return <><PageHeader title={locale === "zh-TW" ? `${report.week_start} 週報` : `Week of ${report.week_start}`} description={report.narrative} action={<Link to="/weekly" className="text-sm font-semibold text-emerald-700 dark:text-mint">← {locale === "zh-TW" ? "所有週報" : "All reports"}</Link>}/><section className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">{cards.map(([name, value, suffix, change]) => <article key={name} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{name}</p><p className="mt-2 text-2xl font-semibold">{value}<span className="text-sm text-slate-400">{suffix}</span></p><p className="mt-2 text-xs text-slate-400">{change == null ? (locale === "zh-TW" ? "沒有前週資料" : "No prior week") : `${delta(change)} ${locale === "zh-TW" ? "較前週" : "vs prior week"}`}</p></article>)}</section><section className="mt-4 grid gap-4 lg:grid-cols-2"><article className="rounded-[1.75rem] bg-ink p-6 text-white"><p className="text-xs font-bold uppercase tracking-[0.18em] text-mint">{locale === "zh-TW" ? "下週重點" : "Next focus"}</p><h2 className="mt-4 text-xl font-semibold">{report.suggested_focus ?? (locale === "zh-TW" ? "持續自然地開口說英文。" : "Keep speaking naturally.")}</h2></article><article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{locale === "zh-TW" ? "本週訊號" : "This week’s signals"}</p><div className="mt-4 space-y-3 text-sm">{report.stats.improved_categories?.[0] && <p>📈 {label(report.stats.improved_categories[0].category)} ↓ {report.stats.improved_categories[0].decrease_percent}%</p>}{report.stats.top_mistakes?.[0] && <p>🔁 {label(report.stats.top_mistakes[0].category)} · {report.stats.top_mistakes[0].count}×</p>}<p>🔥 {report.stats.streak_weeks ?? 0} {locale === "zh-TW" ? "週連續練習" : "week streak"}</p></div></article></section></>;
}
