import type { SupabaseClient } from "@supabase/supabase-js";

export const QUESTION_TYPES = ["fix_sentence", "how_would_you_say", "fill_blank", "choose_natural", "use_in_sentence", "rewrite_natural", "conversational_reply"] as const;
export type QuestionType = typeof QUESTION_TYPES[number];
export type ReviewCandidate = {
  kind: "due" | "fresh" | "mistake" | "focus";
  key: string;
  learningItemId: string | null;
  mistakeCategory: string | null;
  text: string;
  meaning?: string;
  example?: string;
  importance?: string | null;
  overdueDays?: number;
  evidence?: Array<{ original: string; corrected?: string | null }>;
};
export type ReviewHistory = { learning_item_id: string | null; mistake_category: string | null; question_type: QuestionType; created_at: string };
export type PlannedQuestion = ReviewCandidate & { questionType: QuestionType };

const day = 86_400_000;
const ageDays = (date: string, now: Date) => Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - Date.parse(`${date.slice(0, 10)}T00:00:00Z`)) / day);
const pair = (id: string, type: string) => `${id}:${type}`;

export function selectReviewPlan(input: { due: ReviewCandidate[]; fresh: ReviewCandidate[]; mistakes: ReviewCandidate[]; focus?: ReviewCandidate | null; history: ReviewHistory[]; count: number; now?: Date }): PlannedQuestion[] {
  const count = Math.max(3, Math.min(5, input.count));
  const recentPairs = new Set(input.history.map((row) => pair(row.learning_item_id ?? `mistake:${row.mistake_category}`, row.question_type)));
  const usedKeys = new Set<string>();
  const plan: PlannedQuestion[] = [];
  const chooseType = (candidate: ReviewCandidate) => {
    const id = candidate.learningItemId ?? `mistake:${candidate.mistakeCategory}`;
    const preferred: QuestionType[] = candidate.kind === "mistake" ? ["fix_sentence", "rewrite_natural", "conversational_reply"] : candidate.kind === "focus" ? ["conversational_reply", "use_in_sentence"] : ["how_would_you_say", "fill_blank", "use_in_sentence", "choose_natural"];
    return [...preferred, ...QUESTION_TYPES].find((type) => !recentPairs.has(pair(id, type))) ?? preferred[0];
  };
  const take = (pool: ReviewCandidate[], amount: number) => {
    for (const candidate of pool) {
      if (plan.length >= count || amount <= 0 || usedKeys.has(candidate.key)) continue;
      const questionType = chooseType(candidate);
      const id = candidate.learningItemId ?? `mistake:${candidate.mistakeCategory}`;
      if (recentPairs.has(pair(id, questionType))) continue;
      plan.push({ ...candidate, questionType }); usedKeys.add(candidate.key); recentPairs.add(pair(id, questionType)); amount -= 1;
    }
  };
  const due = [...input.due].sort((a,b) => (b.overdueDays ?? 0) - (a.overdueDays ?? 0) || Number(b.importance === "high") - Number(a.importance === "high"));
  take(due, 2); take(input.mistakes, 1); take(input.fresh, 1); if (input.focus) take([input.focus], 1);
  take([...due, ...input.fresh, ...input.mistakes, ...(input.focus ? [input.focus] : [])], count - plan.length);
  return plan;
}

export function questionGenerationPrompt(plan: PlannedQuestion[]) {
  return `Generate ${plan.length} short, conversational English review questions. Return JSON only as {"questions":[...]}. Each question must preserve "candidateKey" and "questionType", and contain "question", "expectedAnswer", "rubric", and "oneHint". Never use TOEIC/test language. Use the learner's evidence without inventing facts.\nCandidates:\n${JSON.stringify(plan)}`;
}

export async function loadReviewPlan(client: SupabaseClient, userId: string, count = 4, now = new Date()) {
  const cutoff = new Date(now.getTime() - 14 * day).toISOString();
  const [dueResult, historyResult, sessionsResult, mistakesResult, settingsResult] = await Promise.all([
    client.from("learning_items").select("id,text,meaning,example,importance,next_review_at").eq("user_id", userId).eq("status", "active").lte("next_review_at", now.toISOString().slice(0,10)).order("next_review_at"),
    client.from("review_events").select("learning_item_id,mistake_category,question_type,created_at").eq("user_id", userId).gte("created_at", cutoff),
    client.from("sessions").select("id,next_session_focus").eq("user_id", userId).order("session_date", { ascending: false }).limit(3),
    client.from("mistake_events").select("category,original,corrected,created_at").eq("user_id", userId).gte("created_at", new Date(now.getTime()-30*day).toISOString()).order("created_at", { ascending: false }),
    client.from("user_settings").select("questions_per_review").eq("user_id", userId).maybeSingle()
  ]);
  const error = dueResult.error ?? historyResult.error ?? sessionsResult.error ?? mistakesResult.error ?? settingsResult.error; if (error) throw error;
  const sessionIds = (sessionsResult.data ?? []).map((row) => row.id);
  const freshResult = sessionIds.length ? await client.from("session_learning_items").select("learning_items(id,text,meaning,example,importance)").in("session_id", sessionIds) : { data: [], error: null };
  if (freshResult.error) throw freshResult.error;
  const due: ReviewCandidate[] = (dueResult.data ?? []).map((row) => ({ kind:"due", key:`item:${row.id}`, learningItemId:row.id, mistakeCategory:null, text:row.text, meaning:row.meaning, example:row.example, importance:row.importance, overdueDays:Math.max(0,ageDays(row.next_review_at,now)) }));
  const fresh: ReviewCandidate[] = (freshResult.data ?? []).flatMap((row: any) => { const item=Array.isArray(row.learning_items)?row.learning_items[0]:row.learning_items; return item ? [{ kind:"fresh" as const,key:`item:${item.id}`,learningItemId:item.id,mistakeCategory:null,text:item.text,meaning:item.meaning,example:item.example,importance:item.importance }] : []; });
  const groups = new Map<string, Array<{original:string;corrected:string|null}>>(); (mistakesResult.data ?? []).forEach((row) => groups.set(row.category,[...(groups.get(row.category)??[]),{original:row.original,corrected:row.corrected}]));
  const mistakes: ReviewCandidate[] = [...groups].sort((a,b)=>b[1].length-a[1].length).map(([category,evidence])=>({kind:"mistake",key:`mistake:${category}`,learningItemId:null,mistakeCategory:category,text:category,evidence:evidence.slice(0,3)}));
  const focusText = (sessionsResult.data ?? []).find((row)=>row.next_session_focus)?.next_session_focus;
  const focus: ReviewCandidate|null = focusText ? {kind:"focus",key:`focus:${focusText}`,learningItemId:null,mistakeCategory:"other",text:focusText}:null;
  return selectReviewPlan({ due,fresh,mistakes,focus,history:(historyResult.data??[]) as ReviewHistory[],count:settingsResult.data?.questions_per_review??count,now });
}
