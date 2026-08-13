import { describe, expect, it, vi } from "vitest";
import { weeklyDelta, type WeeklyReportRow } from "./weeklyReports";

vi.mock("./supabase", () => ({ supabase: {} }));

const report = (stats: WeeklyReportRow["stats"]): WeeklyReportRow => ({ id: "1", week_start: "2026-08-10", stats, narrative: "A week.", suggested_focus: null, created_at: "2026-08-17T00:00:00Z" });

describe("weeklyDelta", () => {
  it("compares the report with its previous week", () => {
    expect(weeklyDelta(report({ minutes: 78, sessions: 3, new_items: 11, reviews_done: 18 }), report({ minutes: 60, sessions: 2, new_items: 8, reviews_done: 20 }))).toEqual({ minutes: 18, sessions: 1, newItems: 3, reviewsDone: -2 });
  });
  it("returns null without a previous report", () => expect(weeklyDelta(report({}), null)).toBeNull());
});
