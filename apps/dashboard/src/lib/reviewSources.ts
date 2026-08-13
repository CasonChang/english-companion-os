import type { DueReviewItem, RecentMistake } from "./reviewQuestions";
import { supabase } from "./supabase";

const dueColumns = "id,type,text,meaning,example,note,review_level,next_review_at,days_overdue";
const mistakeColumns = "id,category,original,corrected,explanation,created_at";

/** Fetches only the small source pool needed to build a client-side Daily Mix. */
export async function loadReviewSources() {
  const [itemsResult, mistakesResult] = await Promise.all([
    supabase.from("v_due_reviews").select(dueColumns).limit(10),
    supabase.from("mistake_events").select(mistakeColumns).not("corrected", "is", null).order("created_at", { ascending: false }).limit(20)
  ]);
  const error = itemsResult.error ?? mistakesResult.error;
  if (error) throw error;
  return {
    items: (itemsResult.data ?? []) as DueReviewItem[],
    mistakes: (mistakesResult.data ?? []) as RecentMistake[]
  };
}
