import { supabase } from "./supabase";

export type MistakeCategoryStat = {
  user_id: string;
  category: string;
  total_count: number;
  last_30_days_count: number;
  previous_30_days_count: number;
  trend: "improving" | "flat" | "growing";
};

export type MistakeEvidence = {
  id: string;
  category: string;
  original: string;
  corrected: string | null;
  explanation: string | null;
  is_recurring: boolean;
  created_at: string;
  sessions: { id: string; session_date: string; topics: string[] };
};

export async function loadMistakeStats() {
  const { data, error } = await supabase.from("v_mistake_category_stats").select("user_id,category,total_count,last_30_days_count,previous_30_days_count,trend").order("total_count", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MistakeCategoryStat[];
}

export async function loadMistakeCategory(category: string) {
  const [statsResult, eventsResult] = await Promise.all([
    supabase.from("v_mistake_category_stats").select("user_id,category,total_count,last_30_days_count,previous_30_days_count,trend").eq("category", category).maybeSingle(),
    supabase.from("mistake_events").select("id,category,original,corrected,explanation,is_recurring,created_at,sessions(id,session_date,topics)").eq("category", category).order("created_at", { ascending: false })
  ]);
  const error = statsResult.error ?? eventsResult.error;
  if (error) throw error;
  return { stats: statsResult.data as MistakeCategoryStat | null, events: (eventsResult.data ?? []) as unknown as MistakeEvidence[] };
}

export type MonthlyMistakeCount = { month: string; count: number };

export function groupMistakesByMonth(events: MistakeEvidence[]): MonthlyMistakeCount[] {
  const counts = new Map<string, number>();
  for (const event of events) {
    const month = event.created_at.slice(0, 7);
    counts.set(month, (counts.get(month) ?? 0) + 1);
  }
  return [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count }));
}
