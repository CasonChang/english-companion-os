export type DueReviewItem = {
  id: string;
  type: string;
  text: string;
  meaning: string;
  example: string;
  note: string | null;
  review_level: number;
  next_review_at: string;
  days_overdue: number;
};

export type RecentMistake = {
  id: string;
  category: string;
  original: string;
  corrected: string | null;
  explanation: string | null;
  created_at: string;
};

export type ReviewQuestionType = "how_would_you_say" | "fill_blank" | "fix_sentence" | "use_in_sentence";

export type ReviewQuestion = {
  id: string;
  type: ReviewQuestionType;
  prompt: string;
  answer: string;
  note: string | null;
  learningItemId: string | null;
  mistakeCategory: string | null;
};

function shuffled<T>(values: T[], random: () => number): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function cloze(example: string, text: string): string | null {
  const start = example.toLocaleLowerCase().indexOf(text.toLocaleLowerCase());
  if (start < 0) return null;
  return `${example.slice(0, start)}______${example.slice(start + text.length)}`;
}

function itemQuestion(item: DueReviewItem, preferred: Exclude<ReviewQuestionType, "fix_sentence">): ReviewQuestion {
  const blankedExample = cloze(item.example, item.text);
  const type = preferred === "fill_blank" && !blankedExample ? "how_would_you_say" : preferred;
  const prompts: Record<typeof type, string> = {
    how_would_you_say: `How would you naturally say: ${item.meaning}?`,
    fill_blank: blankedExample ?? `How would you naturally say: ${item.meaning}?`,
    use_in_sentence: `Make your own sentence with “${item.text}”.`
  };
  return {
    id: `item:${item.id}`,
    type,
    prompt: prompts[type],
    answer: type === "use_in_sentence" ? item.example : item.text,
    note: type === "use_in_sentence" ? "Compare your sentence with this stored example." : item.note,
    learningItemId: item.id,
    mistakeCategory: null
  };
}

/** Builds one varied card per source, so a Daily Mix never repeats an item or mistake. */
export function buildReviewQuestions(
  items: DueReviewItem[],
  mistakes: RecentMistake[],
  options: { limit?: number; random?: () => number } = {}
): ReviewQuestion[] {
  const limit = Math.max(0, Math.min(options.limit ?? 10, 10));
  const random = options.random ?? Math.random;
  const uniqueItems = [...new Map(items.map((item) => [item.id, item])).values()];
  const uniqueMistakes = [...new Map(mistakes.filter((mistake) => mistake.corrected).map((mistake) => [mistake.id, mistake])).values()];
  const itemTypes = ["how_would_you_say", "fill_blank", "use_in_sentence"] as const;
  const itemCards = shuffled(uniqueItems, random).map((item, index) => itemQuestion(item, itemTypes[index % itemTypes.length]));
  const mistakeCards = shuffled(uniqueMistakes, random).map<ReviewQuestion>((mistake) => ({
    id: `mistake:${mistake.id}`,
    type: "fix_sentence",
    prompt: `Fix this sentence: “${mistake.original}”`,
    answer: mistake.corrected!,
    note: mistake.explanation,
    learningItemId: null,
    mistakeCategory: mistake.category
  }));

  const mixed: ReviewQuestion[] = [];
  while (mixed.length < limit && (itemCards.length || mistakeCards.length)) {
    if (itemCards.length) mixed.push(itemCards.shift()!);
    if (mixed.length < limit && itemCards.length) mixed.push(itemCards.shift()!);
    if (mixed.length < limit && mistakeCards.length) mixed.push(mistakeCards.shift()!);
  }
  return mixed;
}
