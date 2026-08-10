import { supabase } from "./supabase";

export type SessionSummary = {
  id: string;
  session_date: string;
  topics: string[];
  summary: string;
  next_session_focus: string | null;
};

export type LearningItem = {
  id: string;
  type: string;
  text: string;
  meaning: string;
  example: string;
  note: string | null;
  importance: string | null;
};

export type SessionItemOccurrence = {
  example_in_session: string | null;
  learning_items: LearningItem;
};

export type MistakeEvent = {
  id: string;
  category: string;
  original: string;
  corrected: string | null;
  explanation: string | null;
  is_recurring: boolean;
};

export type PronunciationNote = { word_or_sound: string; note: string };

export type SessionDetail = SessionSummary & {
  shadowing: string[];
  pronunciation_notes: PronunciationNote[];
  memory_candidates: string[];
  session_learning_items: SessionItemOccurrence[];
  mistakes: MistakeEvent[];
};

export async function loadSessions() {
  const { data, error } = await supabase
    .from("sessions")
    .select("id,session_date,topics,summary,next_session_focus")
    .order("session_date", { ascending: false })
    .order("start_time", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as SessionSummary[];
}

export async function loadSession(id: string): Promise<SessionDetail | null> {
  const [sessionResult, mistakesResult] = await Promise.all([
    supabase
      .from("sessions")
      .select("id,session_date,topics,summary,next_session_focus,shadowing,pronunciation_notes,memory_candidates,session_learning_items(example_in_session,learning_items(id,type,text,meaning,example,note,importance))")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("mistake_events")
      .select("id,category,original,corrected,explanation,is_recurring")
      .eq("session_id", id)
      .order("created_at")
  ]);
  const error = sessionResult.error ?? mistakesResult.error;
  if (error) throw error;
  if (!sessionResult.data) return null;
  return { ...(sessionResult.data as unknown as Omit<SessionDetail, "mistakes">), mistakes: (mistakesResult.data ?? []) as MistakeEvent[] };
}
