import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { EmptyState } from "../components/EmptyState";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { PageHeader } from "../components/PageHeader";
import { loadHomeData, type HomeData } from "../lib/home";
import { useI18n } from "../features/i18n/I18nProvider";

const formatDate = (value: string, locale = "en") => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(new Date(`${value}T00:00:00`));

function StatCard({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight">{value}<span className="ml-1 text-sm font-medium text-slate-400">{suffix}</span></p></article>;
}

export function DashboardPage() {
  const { t, locale } = useI18n();
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void loadHomeData().then((result) => active && setData(result)).catch(() => active && setError(locale === "zh-TW" ? "目前無法載入學習總覽，請稍後再試。" : "We couldn’t load your learning overview. Please try again in a moment."));
    return () => { active = false; };
  }, []);

  if (error) return <><PageHeader eyebrow={t("Today")} title={t("Welcome back")}/><EmptyState icon="↻" title="Your overview is taking a short break" description={error}/></>;
  if (!data) return <><PageHeader eyebrow={t("Today")} title={t("Loading your space…")}/><LoadingSkeleton/></>;

  const latest = data.latestSession;
  const focus = latest?.next_session_focus;
  return (
    <>
      <PageHeader eyebrow={t("Today")} title={locale === "zh-TW" ? `嗨，我是 ${data.agentName}` : `Hi, I’m ${data.agentName}`} description={data.dueCount ? (locale === "zh-TW" ? `有 ${data.dueCount} 個項目到期，要花五分鐘複習嗎？` : `${data.dueCount} item${data.dueCount === 1 ? "" : "s"} due — got five minutes?`) : (locale === "zh-TW" ? "目前都複習完了，做得很好。" : "You’re all caught up. Nice work.")}/>

      <section className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("New items")} value={data.weekItems}/>
        <StatCard label={t("Sessions")} value={data.weekSessions}/>
        <StatCard label={t("Weekly streak")} value={data.weeklyStreak} suffix={locale === "zh-TW" ? "週" : "wk"}/>
        <StatCard label={t("Due today")} value={data.dueCount}/>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <article className="rounded-[1.75rem] bg-ink p-6 text-white shadow-card dark:border dark:border-white/10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-mint">{t("Current focus")}</p>
          <h2 className="mt-5 text-2xl font-semibold leading-snug">{focus ?? (locale === "zh-TW" ? "繼續培養自然的英文說話節奏。" : "Keep building a natural speaking rhythm.")}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">{locale === "zh-TW" ? "下次 GPT-Live 對話時，試著把這個重點用出來。" : "Bring this into your next GPT-Live conversation."}</p>
          {data.latestReportWeek && <Link to={`/weekly/${data.latestReportWeek}`} className="mt-5 inline-flex text-sm font-semibold text-mint hover:underline">{locale === "zh-TW" ? "查看最新週報 →" : "View latest report →"}</Link>}
        </article>

        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-mint">{t("Last session")}</p>{latest && <span className="text-xs text-slate-400">{formatDate(latest.session_date, locale)}</span>}</div>
          {latest ? <><h2 className="mt-5 line-clamp-1 text-xl font-semibold">{latest.topics.join(" · ")}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{latest.summary}</p><Link to={`/sessions/${latest.id}`} className="mt-4 inline-flex text-sm font-semibold text-emerald-700 hover:underline dark:text-mint">{t("Open session →")}</Link></> : <p className="mt-5 text-sm text-slate-500">{locale === "zh-TW" ? "第一筆保存的對話會顯示在這裡。" : "Your first saved conversation will appear here."}</p>}
        </article>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
        <article className="min-w-0 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{t("8-week activity")}</p><h2 className="mt-1 font-semibold">{t("Practice sessions")}</h2></div><span className="text-xs text-slate-400">{t("Sessions / week")}</span></div>
          <div className="mt-5 h-40 min-w-[280px]" aria-label="Eight week speaking activity chart">
            <ResponsiveContainer width="100%" height="100%"><BarChart data={data.weeklyActivity}><XAxis dataKey="week_start" tickFormatter={(value: string) => formatDate(value, locale)} tickLine={false} axisLine={false} fontSize={11}/><Tooltip cursor={{ fill: "rgba(159,227,195,.16)" }} labelFormatter={(value) => `Week of ${formatDate(String(value))}`}/><Bar dataKey="session_count" fill="#75cfa8" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer>
          </div>
        </article>

        <aside className="flex min-w-60 flex-col justify-between rounded-[1.75rem] bg-coral p-6 text-ink shadow-sm"><div><p className="text-xs font-bold uppercase tracking-[0.2em]">{t("Daily review")}</p><p className="mt-3 text-3xl font-semibold">{data.dueCount}</p><p className="text-sm font-medium">{t("items waiting")}</p></div><Link to="/review" className="mt-8 rounded-xl bg-ink px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800">{data.dueCount ? t("Start review") : t("View review")}</Link></aside>
      </section>
    </>
  );
}
