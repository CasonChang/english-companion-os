import { supabase } from "./supabase";

export type LearningItemRow = {
  id: string;
  type: string;
  text: string;
  meaning: string;
  example: string;
  note: string | null;
  importance: string | null;
  times_seen: number;
  review_level: number;
  next_review_at: string;
  last_reviewed_at: string | null;
  consecutive_good: number;
  status: "active" | "mastered" | "archived";
  created_at: string;
};

export type ItemOccurrence = {
  example_in_session: string | null;
  sessions: { id: string; session_date: string; topics: string[] };
};

export type ItemReview = {
  id: string;
  channel: "telegram" | "web";
  question_type: string;
  question: string;
  user_answer: string | null;
  evaluation: string | null;
  rating: "again" | "hard" | "good" | "easy";
  created_at: string;
};

export type LearningItemDetail = LearningItemRow & { occurrences: ItemOccurrence[]; reviews: ItemReview[] };

const itemColumns = "id,type,text,meaning,example,note,importance,times_seen,review_level,next_review_at,last_reviewed_at,consecutive_good,status,created_at";

export async function loadLearningItems() {
  const { data, error } = await supabase.from("learning_items").select(itemColumns).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as LearningItemRow[];
}

export async function loadLearningItem(id: string): Promise<LearningItemDetail | null> {
  const [itemResult, occurrencesResult, reviewsResult] = await Promise.all([
    supabase.from("learning_items").select(itemColumns).eq("id", id).maybeSingle(),
    supabase.from("session_learning_items").select("example_in_session,sessions(id,session_date,topics)").eq("learning_item_id", id),
    supabase.from("review_events").select("id,channel,question_type,question,user_answer,evaluation,rating,created_at").eq("learning_item_id", id).order("created_at", { ascending: false })
  ]);
  const error = itemResult.error ?? occurrencesResult.error ?? reviewsResult.error;
  if (error) throw error;
  if (!itemResult.data) return null;
  return { ...(itemResult.data as LearningItemRow), occurrences: (occurrencesResult.data ?? []) as unknown as ItemOccurrence[], reviews: (reviewsResult.data ?? []) as ItemReview[] };
}
