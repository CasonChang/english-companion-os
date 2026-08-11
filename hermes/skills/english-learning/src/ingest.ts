import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SessionExport } from "./types.js";
import { validateSession } from "./validator.js";

export type IngestStats = { duplicate: boolean; session_id: string; session_date?: string; duration_minutes?: number | null; new_items?: number; seen_items?: number; corrections?: number; recurring_events?: number; due_tomorrow?: number };
export type IngestResult = { ok: true; stats: IngestStats; message: string; memoryCandidates: string[] } | { ok: false; message: string };

export function createHermesSupabase(env = process.env) {
  const url = env.SUPABASE_URL; const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Hermes is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function formatIngestConfirmation(stats: IngestStats) {
  if (stats.duplicate) return `I already have this session (${stats.session_id}), so I didn't add anything twice.`;
  const duration = stats.duration_minutes == null ? "duration not recorded" : `${stats.duration_minutes} min`;
  return `✅ Ingested ${stats.session_date}: ${duration}, ${stats.new_items} new item(s) (${stats.seen_items} seen before), ${stats.corrections} correction(s), ${stats.recurring_events} recurring example(s). ${stats.due_tomorrow} item(s) due by tomorrow.`;
}

export async function ingestSession(input: string | unknown, options: { client?: SupabaseClient; userId?: string; now?: Date; allowDateOutsideWindow?: boolean } = {}): Promise<IngestResult> {
  const validation = validateSession(input, options);
  if (!validation.ok) return { ok: false, message: validation.summary };
  const userId = options.userId ?? process.env.ECOS_USER_ID;
  if (!userId) return { ok: false, message: "Hermes is missing ECOS_USER_ID, so I didn't write anything." };
  const client = options.client ?? createHermesSupabase();
  const { data, error } = await client.rpc("ingest_english_session", { p_user_id: userId, p_payload: validation.value });
  if (error) return { ok: false, message: "I validated the session, but Supabase couldn't save it. Nothing was partially imported; please try again." };
  const stats = data as IngestStats;
  return { ok: true, stats, message: formatIngestConfirmation(stats), memoryCandidates: validation.value.memory_candidates };
}

export type { SessionExport };
