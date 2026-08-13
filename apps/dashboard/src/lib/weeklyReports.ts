import { supabase } from "./supabase";

export type WeeklyReportStats = {
  minutes?: number;
  sessions?: number;
  new_items?: number;
  reviews_done?: number;
  reviews_due?: number;
  streak_weeks?: number;
  improved_categories?: Array<{ category: string; decrease_percent: number }>;
  top_mistakes?: Array<{ category: string; count: number }>;
};

export type WeeklyReportRow = {
  id: string;
  week_start: string;
  stats: WeeklyReportStats;
  narrative: string;
  suggested_focus: string | null;
  created_at: string;
};

export type WeeklyDelta = { minutes: number; sessions: number; newItems: number; reviewsDone: number };

const columns = "id,week_start,stats,narrative,suggested_focus,created_at";

export async function loadWeeklyReports() {
  const { data, error } = await supabase.from("weekly_reports").select(columns).order("week_start", { ascending: false });
  if (error) throw error;
  return (data ?? []) as WeeklyReportRow[];
}

export async function loadWeeklyReport(weekStart: string) {
  const { data, error } = await supabase.from("weekly_reports").select(columns).lte("week_start", weekStart).order("week_start", { ascending: false }).limit(2);
  if (error) throw error;
  const rows = (data ?? []) as WeeklyReportRow[];
  return { report: rows.find((row) => row.week_start === weekStart) ?? null, previous: rows.find((row) => row.week_start < weekStart) ?? null };
}

export function weeklyDelta(report: WeeklyReportRow, previous: WeeklyReportRow | null): WeeklyDelta | null {
  if (!previous) return null;
  return {
    minutes: (report.stats.minutes ?? 0) - (previous.stats.minutes ?? 0),
    sessions: (report.stats.sessions ?? 0) - (previous.stats.sessions ?? 0),
    newItems: (report.stats.new_items ?? 0) - (previous.stats.new_items ?? 0),
    reviewsDone: (report.stats.reviews_done ?? 0) - (previous.stats.reviews_done ?? 0)
  };
}
