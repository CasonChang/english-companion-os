import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { formatIngestConfirmation, ingestSession } from "../src/ingest.js";
const payload = readFileSync(new URL("../../../../shared/schemas/examples/session-valid.json", import.meta.url), "utf8");
const now = new Date("2026-08-11T12:00:00Z");
const client = (data: unknown, error: unknown = null) => ({ rpc: vi.fn().mockResolvedValue({ data, error }) });
describe("ingestSession", () => {
  it("does not call Supabase for invalid input", async () => { const mock = client(null); const result = await ingestSession("not json", { client: mock as never, userId: "user", now }); expect(result.ok).toBe(false); expect(mock.rpc).not.toHaveBeenCalled(); });
  it("returns stats and memory candidates after the atomic RPC", async () => { const stats = { duplicate: false, session_id: "session", session_date: "2026-08-10", duration_minutes: null, new_items: 3, seen_items: 1, corrections: 2, recurring_events: 1, due_tomorrow: 4 }; const mock = client(stats); const result = await ingestSession(payload, { client: mock as never, userId: "user", now }); expect(result).toMatchObject({ ok: true, stats }); expect(mock.rpc).toHaveBeenCalledWith("ingest_english_session", expect.objectContaining({ p_user_id: "user" })); if (result.ok) expect(result.memoryCandidates.length).toBeGreaterThan(0); });
  it("makes duplicate and database failure responses human-readable", async () => { expect(formatIngestConfirmation({ duplicate: true, session_id: "abc" })).toContain("already have"); const result = await ingestSession(payload, { client: client(null, { message: "secret detail" }) as never, userId: "user", now }); expect(result).toEqual({ ok: false, message: expect.not.stringContaining("secret detail") }); });
});
