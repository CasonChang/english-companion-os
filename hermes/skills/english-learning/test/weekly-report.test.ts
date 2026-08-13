import { describe, expect, it, vi } from "vitest";
import { buildWeeklyReport, claimWeeklyReportSchedule, reportPeriod, weeklyTelegramMessage } from "../src/weekly-report.js";

describe("weekly reports", () => {
  it("uses the previous completed ISO week", () => {
    expect(reportPeriod(new Date("2026-08-17T20:00:00Z"))).toEqual({ weekStart: "2026-08-10", weekEnd: "2026-08-16" });
  });

  it("claims the configured schedule through the database", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { action: "report", week_start: "2026-08-10", week_end: "2026-08-16" }, error: null });
    const claim = await claimWeeklyReportSchedule({ rpc } as never, "user-1", new Date("2026-08-16T12:00:00Z"));
    expect(claim.action).toBe("report");
    expect(rpc).toHaveBeenCalledWith("claim_weekly_report_schedule", expect.objectContaining({ p_user_id: "user-1" }));
  });

  it("matches hand-computed activity, retention, trends, and streak", () => {
    const report = buildWeeklyReport({
      sessions: [{ duration_minutes: 30, next_session_focus: "past-tense storytelling" }, { duration_minutes: 48, next_session_focus: null }, { duration_minutes: null, next_session_focus: null }],
      items: Array.from({ length: 11 }, (_, id) => ({ id: String(id) })),
      reviews: Array.from({ length: 18 }, (_, id) => ({ id: String(id) })),
      dueCount: 4,
      currentMistakes: [{ category: "articles" }, { category: "articles" }, { category: "prepositions" }],
      previousMistakes: [...Array.from({ length: 9 }, () => ({ category: "prepositions" })), ...Array.from({ length: 6 }, () => ({ category: "articles" }))],
      activity: Array.from({ length: 6 }, (_, index) => ({ week_start: new Date(Date.UTC(2026, 7, 10) - index * 7 * 86_400_000).toISOString().slice(0, 10), session_count: 1 }))
    }, { weekStart: "2026-08-10", weekEnd: "2026-08-16" });
    expect(report.stats).toMatchObject({ minutes: 78, sessions: 3, new_items: 11, reviews_done: 18, reviews_due: 22, streak_weeks: 6 });
    expect(report.stats.improved_categories[0]).toMatchObject({ category: "prepositions", decrease_percent: 67 });
    expect(report.suggestedFocus).toBe("past-tense storytelling");
    expect(weeklyTelegramMessage(report, "https://example.com/")).toContain("✅ 18/22 reviews done");
    expect(weeklyTelegramMessage(report, "https://example.com/")).toContain("Full report → https://example.com/#/weekly");
  });
});
