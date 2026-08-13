import type { WeeklyActivity } from "./home";

function isoWeekStart(date = new Date()) {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() - day + 1);
  return utc.toISOString().slice(0, 10);
}

export function calculateWeeklyStreak(activity: WeeklyActivity[], today = new Date()) {
  const activeWeeks = activity
    .filter((week) => week.session_count > 0)
    .map((week) => week.week_start)
    .sort((a, b) => b.localeCompare(a));

  if (!activeWeeks.length) return 0;
  const thisWeek = new Date(`${isoWeekStart(today)}T00:00:00Z`);
  const latest = new Date(`${activeWeeks[0]}T00:00:00Z`);
  const gapFromCurrent = Math.round((thisWeek.getTime() - latest.getTime()) / 86_400_000);
  if (gapFromCurrent > 7) return 0;

  let streak = 1;
  for (let index = 1; index < activeWeeks.length; index += 1) {
    const previous = new Date(`${activeWeeks[index - 1]}T00:00:00Z`);
    const current = new Date(`${activeWeeks[index]}T00:00:00Z`);
    if (Math.round((previous.getTime() - current.getTime()) / 86_400_000) !== 7) break;
    streak += 1;
  }
  return streak;
}

export { isoWeekStart };
