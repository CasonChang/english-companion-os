import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { PageHeader } from "../components/PageHeader";
import { useI18n } from "../features/i18n/I18nProvider";
import { loadWeeklyReports, type WeeklyReportRow } from "../lib/weeklyReports";

const weekLabel = (value: string, locale: string) => {
  const start = new Date(`${value}T00:00:00Z`);
  const end = new Date(start.getTime() + 6 * 86_400_000);
  const format = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" });
  return `${format.format(start)} – ${format.format(end)}`;
};

export function WeeklyPage() {
  const { locale } = useI18n();
  const [reports, setReports] = useState<WeeklyReportRow[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; void loadWeeklyReports().then((rows) => active && setReports(rows)).catch(() => active && setError(locale === "zh-TW" ? "目前無法載入週報。" : "We couldn’t load your weekly reports.")); return () => { active = false; }; }, [locale]);
  if (error) return <><PageHeader eyebrow="Reflection" title={locale === "zh-TW" ? "每週回顧" : "Weekly"}/><EmptyState icon="↻" title={locale === "zh-TW" ? "週報暫時無法載入" : "Weekly reports couldn’t load"} description={error}/></>;
  if (!reports) return <><PageHeader eyebrow="Reflection" title={locale === "zh-TW" ? "每週回顧" : "Weekly"}/><LoadingSkeleton/></>;
  return <><PageHeader eyebrow="Reflection" title={locale === "zh-TW" ? "每週回顧" : "Weekly"} description={locale === "zh-TW" ? "回顧每週的練習、進步與下一個重點。" : "Look back at each week’s practice, progress, and next focus."}/>{reports.length === 0 ? <EmptyState title={locale === "zh-TW" ? "還沒有週報" : "No weekly reports yet"} description={locale === "zh-TW" ? "第一個完整學習週結束後，週報會出現在這裡。" : "Your first report will appear after a complete learning week."}/> : <section className="mt-7 grid gap-4 lg:grid-cols-2">{reports.map((report, index) => <Link key={report.id} to={`/weekly/${report.week_start}`} className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card dark:border-white/10 dark:bg-white/5"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-mint">{index === 0 ? (locale === "zh-TW" ? "最新週報" : "Latest report") : (locale === "zh-TW" ? "每週回顧" : "Weekly reflection")}</p><span className="text-sm text-slate-400">→</span></div><h2 className="mt-4 text-xl font-semibold">{weekLabel(report.week_start, locale)}</h2><p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{report.narrative}</p><div className="mt-5 flex gap-5 text-sm"><span><strong>{report.stats.minutes ?? 0}</strong> min</span><span><strong>{report.stats.sessions ?? 0}</strong> sessions</span><span><strong>{report.stats.reviews_done ?? 0}</strong> reviews</span></div></Link>)}</section>}</>;
}
