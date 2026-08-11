import { describe, expect, it } from "vitest";

import { filterLearningItems } from "./itemFilters";
import type { LearningItemRow } from "./items";

const item = (text: string, meaning: string, type: string, status: LearningItemRow["status"]): LearningItemRow => ({ id: text, text, meaning, type, status, example: "Example", note: null, importance: null, times_seen: 1, review_level: 0, next_review_at: "2026-08-11", last_reviewed_at: null, consecutive_good: 0, created_at: "2026-08-10" });
const items = [item("follow through", "complete what you promised", "phrasal_verb", "active"), item("exhausted", "extremely tired", "vocabulary", "mastered")];

describe("filterLearningItems", () => {
  it("searches both text and meaning without case sensitivity", () => {
    expect(filterLearningItems(items, { search: "PROMISED", type: "all", status: "all" }).map((row) => row.text)).toEqual(["follow through"]);
  });
  it("composes type and status filters", () => {
    expect(filterLearningItems(items, { search: "", type: "vocabulary", status: "mastered" }).map((row) => row.text)).toEqual(["exhausted"]);
  });
});
