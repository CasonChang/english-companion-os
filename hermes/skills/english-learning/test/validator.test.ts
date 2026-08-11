import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { validateSession } from "../src/validator.js";
const fixture = (name: string) => readFileSync(new URL(`../../../../shared/schemas/examples/${name}`, import.meta.url), "utf8");
const now = new Date("2026-08-11T12:00:00Z");
describe("validateSession", () => {
  it("accepts canonical and fenced JSON", () => { expect(validateSession(fixture("session-valid.json"), { now }).ok).toBe(true); expect(validateSession(`\`\`\`json\n${fixture("session-valid.json")}\n\`\`\``, { now }).ok).toBe(true); });
  it.each([["session-invalid-duration-type.json", "duration_minutes"], ["session-invalid-learning-item-type.json", "learning_items.0.type"], ["session-invalid-missing-summary.json", "session.session_summary"]])("rejects %s with a friendly field name", (name, path) => { const result = validateSession(fixture(name), { now }); expect(result.ok).toBe(false); if (!result.ok) { expect(result.summary).toContain(path); expect(result.summary).not.toContain("stack"); } });
  it("rejects malformed JSON without parser internals", () => { expect(validateSession("{ nope")).toMatchObject({ ok: false, issues: [{ path: "session" }] }); });
  it("requires confirmation for dates outside seven days", () => { const old = JSON.parse(fixture("session-valid.json")); old.session_date = "2026-07-01"; expect(validateSession(old, { now }).ok).toBe(false); expect(validateSession(old, { now, allowDateOutsideWindow: true }).ok).toBe(true); });
  it("rejects impossible dates and blank required text", () => { const value = JSON.parse(fixture("session-valid.json")); value.session_date = "2026-02-31"; value.session_summary = "   "; const result = validateSession(value, { now, allowDateOutsideWindow: true }); expect(result.ok).toBe(false); if (!result.ok) expect(result.issues.map((issue) => issue.path)).toEqual(expect.arrayContaining(["session_date", "session_summary"])); });
});
