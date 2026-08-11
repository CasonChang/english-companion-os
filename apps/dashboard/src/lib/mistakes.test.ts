import { describe, expect, it, vi } from "vitest";

vi.mock("./supabase", () => ({ supabase: {} }));

import { groupMistakesByMonth, type MistakeEvidence } from "./mistakes";

const event = (created_at: string): MistakeEvidence => ({ id: created_at, created_at, category: "articles", original: "example", corrected: null, explanation: null, is_recurring: false, sessions: { id: "session", session_date: "2026-08-10", topics: [] } });

describe("groupMistakesByMonth", () => {
  it("groups events chronologically by calendar month", () => {
    expect(groupMistakesByMonth([event("2026-08-10T12:00:00Z"), event("2026-07-01T12:00:00Z"), event("2026-08-11T12:00:00Z")])).toEqual([{ month: "2026-07", count: 1 }, { month: "2026-08", count: 2 }]);
  });
});
