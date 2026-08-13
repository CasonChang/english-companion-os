import { describe, expect, it } from "vitest";

import type { WeeklyActivity } from "./home";
import { calculateWeeklyStreak } from "./weeklyStreak";

const week = (week_start: string, session_count = 1): WeeklyActivity => ({ week_start, session_count, total_minutes: 30, new_items: 2, reviews_done: 3 });

describe("calculateWeeklyStreak", () => {
  it("counts consecutive active ISO weeks", () => {
    expect(calculateWeeklyStreak([week("2026-08-10"), week("2026-08-03"), week("2026-07-27"), week("2026-07-13")], new Date("2026-08-10T12:00:00Z"))).toBe(3);
  });

  it("returns zero when the last practice is older than the previous week", () => {
    expect(calculateWeeklyStreak([week("2026-07-20")], new Date("2026-08-10T12:00:00Z"))).toBe(0);
  });

  it("counts from the previous week when the current week is still empty", () => {
    expect(calculateWeeklyStreak([week("2026-08-03"), week("2026-07-27")], new Date("2026-08-10T00:30:00-07:00"))).toBe(2);
  });
});
