import { supabase } from "./supabase";
import { isoWeekStart } from "./weeklyStreak";

export type ProgressWeek = { week: string; sessions: number; reviewsDone: number; reviewsDue: number; mastered: number; mistakes: Record<string, number> };
const addDays = (date: string, days: number) => { const value = new Date(`${date}T00:00:00Z`); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10); };

export function buildProgressWeeks(activity: Array<{ week_start: string; session_count: number }>, reviews: Array<{ created_at: string }>, items: Array<{ next_review_at: string; status: string; updated_at: string }>, mistakes: Array<{ category: string; created_at: string }>, today = new Date()) {
  const end = isoWeekStart(today);
  const weeks: ProgressWeek[] = Array.from({ length: 12 }, (_, index) => ({ week: addDays(end, (index - 11) * 7), sessions: 0, reviewsDone: 0, reviewsDue: 0, mastered: 0, mistakes: {} }));
  const byWeek = new Map(weeks.map((week) => [week.week, week]));
  activity.forEach((row) => { const week = byWeek.get(row.week_start); if (week) week.sessions = row.session_count; });
  reviews.forEach((row) => { const week = byWeek.get(isoWeekStart(new Date(row.created_at))); if (week) week.reviewsDone += 1; });
  items.forEach((row) => { const due = byWeek.get(isoWeekStart(new Date(`${row.next_review_at}T00:00:00Z`))); if (due) due.reviewsDue += 1; });
  mistakes.forEach((row) => { const week = byWeek.get(isoWeekStart(new Date(row.created_at))); if (week) week.mistakes[row.category] = (week.mistakes[row.category] ?? 0) + 1; });
  const masteredDates = items.filter((item) => item.status === "mastered").map((item) => item.updated_at.slice(0, 10));
  weeks.forEach((week) => { const weekEnd = addDays(week.week, 7); week.mastered = masteredDates.filter((date) => date < weekEnd).length; });
  return weeks;
}

export async function loadProgressData() {
  const since = addDays(isoWeekStart(), -77);
  const [activity, reviews, items, mistakes] = await Promise.all([
    supabase.from("v_weekly_activity").select("week_start,session_count").gte("week_start", since).order("week_start"),
    supabase.from("review_events").select("created_at").gte("created_at", `${since}T00:00:00Z`),
    supabase.from("learning_items").select("next_review_at,status,updated_at"),
    supabase.from("mistake_events").select("category,created_at").gte("created_at", `${since}T00:00:00Z`)
  ]);
  const error = activity.error ?? reviews.error ?? items.error ?? mistakes.error;
  if (error) throw error;
  const rows = buildProgressWeeks(activity.data ?? [], reviews.data ?? [], items.data ?? [], mistakes.data ?? []);
  const totals = new Map<string, number>();
  rows.forEach((week) => Object.entries(week.mistakes).forEach(([category, count]) => totals.set(category, (totals.get(category) ?? 0) + count)));
  const topCategories = [...totals].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([category]) => category);
  return { rows: rows.map((row) => ({ ...row, ...row.mistakes })), topCategories };
}
