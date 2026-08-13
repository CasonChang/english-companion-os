import type { SupabaseClient } from "@supabase/supabase-js";

const DAY = 86_400_000;

export type WeeklyReportStats = {
  minutes: number;
  sessions: number;
  new_items: number;
  reviews_done: number;
  reviews_due: number;
  streak_weeks: number;
  improved_categories: Array<{ category: string; current: number; previous_average: number; decrease_percent: number }>;
  top_mistakes: Array<{ category: string; count: number }>;
};

export type WeeklyReport = {
  weekStart: string;
  weekEnd: string;
  stats: WeeklyReportStats;
  narrative: string;
  suggestedFocus: string | null;
};

export type WeeklyScheduleClaim = { action: "report" | "silent"; reason?: string; week_start?: string; week_end?: string; timezone?: string };

type WeeklySource = {
  sessions: Array<{ duration_minutes: number | null; next_session_focus: string | null }>;
  items: Array<{ id: string }>;
  reviews: Array<{ id: string }>;
  dueCount: number;
  currentMistakes: Array<{ category: string }>;
  previousMistakes: Array<{ category: string }>;
  activity: Array<{ week_start: string; session_count: number }>;
};

const countCategories = (rows: Array<{ category: string }>) => {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.category, (counts.get(row.category) ?? 0) + 1);
  return counts;
};

const monday = (date: Date) => {
  const midnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const day = new Date(midnight).getUTCDay() || 7;
  return new Date(midnight - (day - 1) * DAY);
};

export function reportPeriod(now = new Date()) {
  const currentMonday = monday(now);
  const start = new Date(currentMonday.getTime() - 7 * DAY);
  const end = new Date(currentMonday.getTime() - DAY);
  return { weekStart: start.toISOString().slice(0, 10), weekEnd: end.toISOString().slice(0, 10) };
}

export function buildWeeklyReport(source: WeeklySource, period: { weekStart: string; weekEnd: string }): WeeklyReport {
  const current = countCategories(source.currentMistakes);
  const previous = countCategories(source.previousMistakes);
  const improved = [...previous].flatMap(([category, count]) => {
    const average = count / 3;
    const currentCount = current.get(category) ?? 0;
    if (average <= 0 || currentCount >= average) return [];
    return [{ category, current: currentCount, previous_average: Number(average.toFixed(1)), decrease_percent: Math.round((1 - currentCount / average) * 100) }];
  }).sort((a, b) => b.decrease_percent - a.decrease_percent);
  const topMistakes = [...current].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));
  const activeWeeks = new Set(source.activity.filter((week) => week.session_count > 0).map((week) => week.week_start));
  let streak = 0;
  for (let cursor = Date.parse(`${period.weekStart}T00:00:00Z`); activeWeeks.has(new Date(cursor).toISOString().slice(0, 10)); cursor -= 7 * DAY) streak += 1;
  const focus = [...source.sessions].reverse().find((session) => session.next_session_focus)?.next_session_focus ?? null;
  const stats: WeeklyReportStats = {
    minutes: source.sessions.reduce((sum, session) => sum + (session.duration_minutes ?? 0), 0),
    sessions: source.sessions.length,
    new_items: source.items.length,
    reviews_done: source.reviews.length,
    reviews_due: source.reviews.length + source.dueCount,
    streak_weeks: streak,
    improved_categories: improved,
    top_mistakes: topMistakes
  };
  const win = improved[0] ? `${improved[0].category.replaceAll("_", " ")} decreased ${improved[0].decrease_percent}%` : "consistent practice";
  const recurring = topMistakes[0] ? `${topMistakes[0].category.replaceAll("_", " ")} appeared ${topMistakes[0].count} time(s)` : "no recurring mistake stood out";
  const narrative = `You practiced for ${stats.minutes} minutes across ${stats.sessions} session(s) and added ${stats.new_items} new expression(s). Your biggest win was ${win}; ${recurring}.`;
  return { ...period, stats, narrative, suggestedFocus: focus };
}

const dateTime = (date: string, end = false) => `${date}T${end ? "23:59:59.999" : "00:00:00.000"}Z`;

export async function claimWeeklyReportSchedule(client: SupabaseClient, userId: string, now?: Date) {
  const { data, error } = await client.rpc("claim_weekly_report_schedule", { p_user_id: userId, ...(now ? { p_now: now.toISOString() } : {}) });
  if (error) throw error;
  return data as WeeklyScheduleClaim;
}

export async function generateWeeklyReport(client: SupabaseClient, userId: string, now = new Date(), claimedPeriod?: { weekStart: string; weekEnd: string }) {
  const period = claimedPeriod ?? reportPeriod(now);
  const previousStart = new Date(Date.parse(`${period.weekStart}T00:00:00Z`) - 21 * DAY).toISOString();
  const [sessions, items, reviews, due, currentMistakes, previousMistakes, activity] = await Promise.all([
    client.from("sessions").select("duration_minutes,next_session_focus").eq("user_id", userId).gte("session_date", period.weekStart).lte("session_date", period.weekEnd).order("session_date"),
    client.from("learning_items").select("id").eq("user_id", userId).gte("created_at", dateTime(period.weekStart)).lte("created_at", dateTime(period.weekEnd, true)),
    client.from("review_events").select("id").eq("user_id", userId).gte("created_at", dateTime(period.weekStart)).lte("created_at", dateTime(period.weekEnd, true)),
    client.from("learning_items").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "active").lte("next_review_at", period.weekEnd),
    client.from("mistake_events").select("category").eq("user_id", userId).gte("created_at", dateTime(period.weekStart)).lte("created_at", dateTime(period.weekEnd, true)),
    client.from("mistake_events").select("category").eq("user_id", userId).gte("created_at", previousStart).lt("created_at", dateTime(period.weekStart)),
    client.from("v_weekly_activity").select("week_start,session_count").eq("user_id", userId).lte("week_start", period.weekStart).order("week_start", { ascending: false }).limit(52)
  ]);
  const error = sessions.error ?? items.error ?? reviews.error ?? due.error ?? currentMistakes.error ?? previousMistakes.error ?? activity.error;
  if (error) throw error;
  const report = buildWeeklyReport({ sessions: sessions.data ?? [], items: items.data ?? [], reviews: reviews.data ?? [], dueCount: due.count ?? 0, currentMistakes: currentMistakes.data ?? [], previousMistakes: previousMistakes.data ?? [], activity: activity.data ?? [] }, period);
  const { error: saveError } = await client.from("weekly_reports").upsert({ user_id: userId, week_start: report.weekStart, stats: report.stats, narrative: report.narrative, suggested_focus: report.suggestedFocus }, { onConflict: "user_id,week_start" });
  if (saveError) throw saveError;
  return report;
}

const shortDate = (value: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
export function weeklyTelegramMessage(report: WeeklyReport, dashboardUrl?: string) {
  const win = report.stats.improved_categories[0];
  const recurring = report.stats.top_mistakes[0];
  return [
    `📊 Week of ${shortDate(report.weekStart)}–${shortDate(report.weekEnd)}`,
    `🗣 ${report.stats.minutes} min · ${report.stats.sessions} sessions (streak: ${report.stats.streak_weeks} weeks)`,
    `✨ ${report.stats.new_items} new expressions · ✅ ${report.stats.reviews_done}/${report.stats.reviews_due} reviews done`,
    `📈 Biggest win: ${win ? `${win.category.replaceAll("_", " ")} ↓ ${win.decrease_percent}% vs. last month` : "consistent practice"}`,
    `🔁 Still recurring: ${recurring ? `${recurring.category.replaceAll("_", " ")} (${recurring.count}×)` : "none"}`,
    `🎯 Next week: ${report.suggestedFocus ?? "keep speaking naturally"}`,
    ...(dashboardUrl ? [`Full report → ${dashboardUrl.replace(/\/$/, "")}/#/weekly`] : [])
  ].join("\n");
}
