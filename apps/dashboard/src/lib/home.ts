import { supabase } from "./supabase";
import { calculateWeeklyStreak, isoWeekStart } from "./weeklyStreak";

export type WeeklyActivity = {
  week_start: string;
  total_minutes: number;
  session_count: number;
  new_items: number;
  reviews_done: number;
};

export type LatestSession = {
  id: string;
  session_date: string;
  duration_minutes: number | null;
  topics: string[];
  summary: string;
  next_session_focus: string | null;
};

export type HomeData = {
  agentName: string;
  dueCount: number;
  latestSession: LatestSession | null;
  weeklyActivity: WeeklyActivity[];
  weekSessions: number;
  weekItems: number;
  weeklyStreak: number;
  latestReportWeek: string | null;
};

export async function loadHomeData(): Promise<HomeData> {
  const [settingsResult, dueResult, sessionResult, activityResult, reportResult] = await Promise.all([
    supabase.from("user_settings").select("agent_name").maybeSingle(),
    supabase.from("v_due_reviews").select("id", { count: "exact", head: true }),
    supabase
      .from("sessions")
      .select("id,session_date,duration_minutes,topics,summary,next_session_focus")
      .order("session_date", { ascending: false })
      .order("start_time", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("v_weekly_activity")
      .select("week_start,total_minutes,session_count,new_items,reviews_done")
      .order("week_start", { ascending: false })
      .limit(8),
    supabase.from("weekly_reports").select("week_start").order("week_start", { ascending: false }).limit(1).maybeSingle()
  ]);

  const error = settingsResult.error ?? dueResult.error ?? sessionResult.error ?? activityResult.error ?? reportResult.error;
  if (error) throw error;

  const activity = (activityResult.data ?? []) as WeeklyActivity[];
  const thisWeek = activity.find((week) => week.week_start === isoWeekStart());
  return {
    agentName: settingsResult.data?.agent_name ?? "Companion",
    dueCount: dueResult.count ?? 0,
    latestSession: sessionResult.data as LatestSession | null,
    weeklyActivity: [...activity].reverse(),
    weekSessions: thisWeek?.session_count ?? 0,
    weekItems: thisWeek?.new_items ?? 0,
    weeklyStreak: calculateWeeklyStreak(activity),
    latestReportWeek: reportResult.data?.week_start ?? null
  };
}
