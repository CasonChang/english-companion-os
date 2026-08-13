import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "../components/EmptyState";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { PageHeader } from "../components/PageHeader";
import { useAuth } from "../features/auth/AuthContext";
import { useI18n } from "../features/i18n/I18nProvider";
import { saveWebReview, type ReviewRating } from "../lib/reviewPersistence";
import { buildReviewQuestions, type ReviewQuestion } from "../lib/reviewQuestions";
import { loadReviewSources } from "../lib/reviewSources";

const typeLabels: Record<ReviewQuestion["type"], string> = {
  how_would_you_say: "Say it naturally",
  fill_blank: "Fill in the blank",
  fix_sentence: "Fix the sentence",
  use_in_sentence: "Use it yourself"
};

const ratings: { value: ReviewRating; label: string; style: string }[] = [
  { value: "again", label: "Again", style: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200" },
  { value: "hard", label: "Hard", style: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200" },
  { value: "good", label: "Good", style: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200" },
  { value: "easy", label: "Easy", style: "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200" }
];

const todayKey = () => new Date().toISOString().slice(0, 10);
const progressKey = (userId: string) => `ecos-review-progress:${userId}:${todayKey()}`;

function completedCards(userId: string): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(progressKey(userId)) ?? "[]");
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function ReviewPage() {
  const { session } = useAuth();
  const { locale } = useI18n();
  const [questions, setQuestions] = useState<ReviewQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [reviewed, setReviewed] = useState(0);
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void loadReviewSources()
      .then(({ items, mistakes }) => {
        if (!active) return;
        const completed = new Set(session?.user.id ? completedCards(session.user.id) : []);
        setQuestions(buildReviewQuestions(items, mistakes).filter((question) => !completed.has(question.id)));
      })
      .catch(() => { if (active) setError(locale === "zh-TW" ? "目前無法載入複習內容，請稍後再試。" : "We couldn’t load today’s review. Please try again."); });
    return () => { active = false; };
  }, [locale, session?.user.id]);

  const question = questions?.[index];
  const finished = questions !== null && questions.length > 0 && index >= questions.length;
  const progress = useMemo(() => questions?.length ? Math.round((reviewed / questions.length) * 100) : 0, [questions, reviewed]);

  async function rate(rating: ReviewRating) {
    if (!question || !session?.user.id || saving) return;
    setSaving(true);
    setError("");
    try {
      await saveWebReview(session.user.id, question, rating, answer);
      const completed = new Set(completedCards(session.user.id));
      completed.add(question.id);
      localStorage.setItem(progressKey(session.user.id), JSON.stringify([...completed]));
      setReviewed((value) => value + 1);
      setIndex((value) => value + 1);
      setAnswer("");
      setRevealed(false);
    } catch {
      setError(locale === "zh-TW" ? "這次評分尚未保存，請再試一次。" : "That rating wasn’t saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (error && !questions) return <><PageHeader eyebrow="Daily mix" title={locale === "zh-TW" ? "每日複習" : "Daily review"}/><EmptyState icon="↻" title={locale === "zh-TW" ? "暫時無法載入" : "Review couldn’t load"} description={error}/></>;
  if (!questions) return <><PageHeader eyebrow="Daily mix" title={locale === "zh-TW" ? "正在準備複習…" : "Preparing your review…"}/><LoadingSkeleton/></>;
  if (questions.length === 0) return <><PageHeader eyebrow="Daily mix" title={locale === "zh-TW" ? "每日複習" : "Daily review"} description={locale === "zh-TW" ? "今天沒有到期項目，好好享受這個空檔。" : "Nothing is due right now. Enjoy the quiet moment."}/><EmptyState title={locale === "zh-TW" ? "今天都完成了" : "You’re all caught up"} description={locale === "zh-TW" ? "下次有項目到期時，它們會出現在這裡。" : "Your next cards will appear here when they become due."}/></>;
  if (finished) return <><PageHeader eyebrow="Daily mix" title={locale === "zh-TW" ? "複習完成" : "Review complete"}/><section className="mt-8 rounded-[2rem] bg-ink p-8 text-center text-white shadow-card dark:border dark:border-white/10"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-mint text-2xl text-ink">✓</span><p className="mt-5 text-4xl font-semibold">{reviewed}</p><h2 className="mt-2 text-xl font-semibold">{locale === "zh-TW" ? "個項目已複習" : "items reviewed"}</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">{locale === "zh-TW" ? "每一次主動回想，都讓這些英文更接近成為你的直覺。" : "Every active recall brings this language closer to becoming instinctive."}</p><button onClick={() => window.location.reload()} className="mt-7 rounded-xl bg-mint px-5 py-3 text-sm font-semibold text-ink hover:bg-emerald-200">{locale === "zh-TW" ? "重新整理到期項目" : "Refresh due items"}</button></section></>;

  return <>
    <PageHeader eyebrow="Daily mix" title={locale === "zh-TW" ? "每日複習" : "Daily review"} description={locale === "zh-TW" ? "先自己說說看，再揭曉答案並誠實評分。" : "Answer out loud or in your head, then reveal and rate honestly."}/>
    <section className="mx-auto mt-7 max-w-3xl">
      <div className="mb-4 flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400"><span>{index + 1} / {questions.length}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"><div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${progress}%` }}/></div><span>{progress}%</span></div>
      <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-card sm:p-9 dark:border-white/10 dark:bg-white/5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-mint">{typeLabels[question!.type]}</p>
        <h2 className="mt-5 text-2xl font-semibold leading-snug sm:text-3xl">{question!.prompt}</h2>
        <label className="mt-7 block"><span className="text-sm font-medium text-slate-500 dark:text-slate-400">{locale === "zh-TW" ? "你的答案（可選填）" : "Your answer (optional)"}</span><textarea value={answer} onChange={(event) => setAnswer(event.target.value)} disabled={revealed} rows={3} className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-mist p-4 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 disabled:opacity-60 dark:border-white/10 dark:bg-black/20 dark:focus:ring-emerald-400/10" placeholder={locale === "zh-TW" ? "也可以直接大聲說出來…" : "Or simply say it out loud…"}/></label>
        {!revealed ? <button onClick={() => setRevealed(true)} className="mt-6 w-full rounded-xl bg-ink px-5 py-3.5 font-semibold text-white transition hover:bg-slate-800 dark:bg-mint dark:text-ink dark:hover:bg-emerald-200">{locale === "zh-TW" ? "顯示答案" : "Show answer"}</button> : <div className="mt-6 border-t border-slate-100 pt-6 dark:border-white/10"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{locale === "zh-TW" ? "參考答案" : "Expected answer"}</p><p className="mt-2 text-xl font-semibold text-emerald-700 dark:text-mint">{question!.answer}</p>{question!.note && <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{question!.note}</p>}<p className="mt-6 text-center text-sm font-medium">{locale === "zh-TW" ? "這題感覺如何？" : "How did that feel?"}</p><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{ratings.map((rating) => <button key={rating.value} onClick={() => void rate(rating.value)} disabled={saving} className={`rounded-xl border px-3 py-3 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-50 ${rating.style}`}>{rating.label}</button>)}</div>{error && <p className="mt-4 text-center text-sm text-rose-600 dark:text-rose-300" role="alert">{error}</p>}</div>}
      </article>
      <p className="mt-4 text-center text-xs text-slate-400">{locale === "zh-TW" ? "每張卡片評分後都會立即保存，可以隨時離開。" : "Each card is saved immediately, so you can leave at any time."}</p>
    </section>
  </>;
}
