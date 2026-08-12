import type { SupabaseClient } from "@supabase/supabase-js";
import type { QuestionType } from "./review.js";
export type Rating="again"|"hard"|"good"|"easy";
export type GeneratedQuestion={candidateKey:string;questionType:QuestionType;question:string;expectedAnswer:string;rubric:string;oneHint:string;learningItemId:string|null;mistakeCategory:string|null};
export type Evaluation={rating:Rating;feedback:string};
export const evaluationPrompt=(q:GeneratedQuestion,answer:string)=>`Evaluate this English review answer. Return JSON only with rating (again|hard|good|easy) and one-sentence feedback. easy=natural and confident; good=correct with minor roughness; hard=right idea but wrong execution; again=incorrect or blank.\nQuestion: ${q.question}\nExpected: ${q.expectedAnswer}\nRubric: ${q.rubric}\nAnswer: ${answer}`;
export const isStop=(x:string)=>/^(stop|停止|結束)$/i.test(x.trim());
export const isSkip=(x:string)=>/^(skip|跳過)$/i.test(x.trim());
export const ratingOverride=(x:string):Rating|null=>{const m=x.toLowerCase().match(/(?:mark (?:it )?|that was |算)(again|hard|good|easy)/);return m?.[1] as Rating??null};
export async function saveReviewResult(client:SupabaseClient,userId:string,q:GeneratedQuestion,answer:string,evaluation:Evaluation){const {data,error}=await client.rpc("save_telegram_review_result",{p_user_id:userId,p_learning_item_id:q.learningItemId,p_mistake_category:q.mistakeCategory,p_question_type:q.questionType,p_question:q.question,p_user_answer:answer,p_evaluation:evaluation.feedback,p_rating:evaluation.rating});if(error)throw error;return data as {event_id:string;rating:Rating;srs_updated:boolean}}
export async function overrideReviewRating(client:SupabaseClient,userId:string,eventId:string,rating:Rating){const {data,error}=await client.rpc("override_telegram_review_rating",{p_user_id:userId,p_event_id:eventId,p_rating:rating});if(error)throw error;return data}
