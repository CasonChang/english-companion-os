import type { ReviewQuestion } from "./reviewQuestions";
import { supabase } from "./supabase";

export type ReviewRating = "again" | "hard" | "good" | "easy";

export async function saveWebReview(
  userId: string,
  question: ReviewQuestion,
  rating: ReviewRating,
  userAnswer: string
) {
  const { error: insertError } = await supabase.from("review_events").insert({
    user_id: userId,
    learning_item_id: question.learningItemId,
    mistake_category: question.mistakeCategory,
    channel: "web",
    question_type: question.type,
    question: question.prompt,
    user_answer: userAnswer.trim() || null,
    evaluation: "Self-rated in Daily Mix",
    rating
  });
  if (insertError) throw insertError;

  if (question.learningItemId) {
    const { error: ratingError } = await supabase.rpc("apply_review_rating", {
      item_id: question.learningItemId,
      rating
    });
    if (ratingError) throw ratingError;
  }
}
