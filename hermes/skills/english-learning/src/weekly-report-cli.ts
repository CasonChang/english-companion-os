#!/usr/bin/env node
import { createHermesSupabase } from "./ingest.js";
import { claimWeeklyReportSchedule, generateWeeklyReport, weeklyTelegramMessage } from "./weekly-report.js";

const userId = process.env.ECOS_USER_ID;
if (!userId) {
  console.log(JSON.stringify({ ok: false, message: "Hermes is missing ECOS_USER_ID." }));
  process.exitCode = 1;
} else {
  try {
    const client = createHermesSupabase();
    const claim = await claimWeeklyReportSchedule(client, userId);
    if (claim.action === "silent") console.log(JSON.stringify({ ok: true, claim, message: null }));
    else {
      const report = await generateWeeklyReport(client, userId, new Date(), { weekStart: claim.week_start!, weekEnd: claim.week_end! });
      console.log(JSON.stringify({ ok: true, claim, report, message: weeklyTelegramMessage(report, process.env.ECOS_DASHBOARD_URL) }));
    }
  } catch {
    console.log(JSON.stringify({ ok: false, message: "I couldn't generate the weekly English report safely." }));
    process.exitCode = 1;
  }
}
