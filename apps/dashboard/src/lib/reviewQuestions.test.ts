import { describe, expect, it } from "vitest";

import { buildReviewQuestions, type DueReviewItem, type RecentMistake } from "./reviewQuestions";

const item = (id: string, text: string, meaning: string, example: string): DueReviewItem => ({
  id, text, meaning, example, type: "phrase", note: null, review_level: 1,
  next_review_at: "2026-08-10", days_overdue: 3
});

const seedItems = [
  item("1", "follow through", "to complete something you promised", "I need to follow through on my plan."),
  item("2", "wind down", "to gradually relax", "I read for a while to wind down."),
  item("3", "I am swamped", "to be extremely busy", "I am swamped at work this week.")
];
const seedMistakes: RecentMistake[] = [{
  id: "m1", category: "verb_tense", original: "I didn't went there.", corrected: "I didn't go there.",
  explanation: "Use the base verb after did not.", created_at: "2026-08-08T12:00:00Z"
}];

describe("buildReviewQuestions", () => {
  it("builds all four valid Daily Mix card types from seed-style data", () => {
    const cards = buildReviewQuestions(seedItems, seedMistakes, { random: () => 0.999, limit: 4 });
    expect(new Set(cards.map((card) => card.type))).toEqual(new Set(["how_would_you_say", "fill_blank", "use_in_sentence", "fix_sentence"]));
    expect(cards.find((card) => card.type === "fill_blank")?.prompt).toContain("______");
    expect(cards.find((card) => card.type === "fix_sentence")?.answer).toBe("I didn't go there.");
  });

  it("deduplicates sources, excludes uncorrected mistakes, and caps a mix at ten", () => {
    const uncorrected = { ...seedMistakes[0], id: "m2", corrected: null };
    const cards = buildReviewQuestions([...seedItems, ...seedItems, ...seedItems, ...seedItems], [seedMistakes[0], seedMistakes[0], uncorrected], { random: () => 0.5, limit: 99 });
    expect(cards).toHaveLength(4);
    expect(new Set(cards.map((card) => card.id)).size).toBe(cards.length);
  });

  it("falls back to a meaning prompt when an example cannot be blanked", () => {
    const cards = buildReviewQuestions([
      item("1", "follow through", "to complete something", "She followed through on the promise."),
      item("2", "wind down", "to relax", "This example does not contain it.")
    ], [], { random: () => 0.999 });
    expect(cards[1].type).toBe("how_would_you_say");
    expect(cards[1].prompt).toContain("to relax");
  });
});
