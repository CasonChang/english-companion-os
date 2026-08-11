import { readFileSync } from "node:fs";
import Ajv2020Module, { type ErrorObject } from "ajv/dist/2020.js";
import type { SessionExport, ValidationIssue, ValidationResult } from "./types.js";

const schema = JSON.parse(readFileSync(new URL("../../../../shared/schemas/session.schema.json", import.meta.url), "utf8"));
const Ajv2020 = Ajv2020Module as unknown as typeof import("ajv").default;
const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateSchema = ajv.compile<SessionExport>(schema);
const displayPath = (path: string) => path ? path.replace(/^\//, "").replaceAll("/", ".") : "session";

function schemaIssue(error: ErrorObject): ValidationIssue {
  const path = error.keyword === "required" ? `${displayPath(error.instancePath)}.${String(error.params.missingProperty)}` : displayPath(error.instancePath);
  let message: string;
  switch (error.keyword) {
    case "required": message = "is required."; break;
    case "type": message = `must be ${String(error.params.type)}.`; break;
    case "enum": message = `must be one of: ${(error.params.allowedValues as unknown[]).join(", ")}.`; break;
    case "const": message = `must be ${String(error.params.allowedValue)}.`; break;
    case "pattern": message = "has an invalid format."; break;
    case "minLength": message = "must not be empty."; break;
    case "minItems": message = "must contain at least one entry."; break;
    case "additionalProperties": message = `contains an unsupported field: ${String(error.params.additionalProperty)}.`; break;
    default: message = `${error.message ?? "is invalid"}.`;
  }
  return { path, message };
}

function semanticIssues(value: SessionExport, now: Date, allowDateOutsideWindow: boolean): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const date = new Date(`${value.session_date}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value.session_date) issues.push({ path: "session_date", message: "must be a real calendar date." });
  else if (!allowDateOutsideWindow) {
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const days = Math.abs(date.getTime() - today) / 86_400_000;
    if (days > 7) issues.push({ path: "session_date", message: "is more than 7 days from today; ask the user to confirm before importing it." });
  }
  const requiredText: Array<[string, unknown]> = [["session_summary", value.session_summary], ...value.topics.map<[string, unknown]>((text, i) => [`topics.${i}`, text])];
  requiredText.forEach(([path, text]) => { if (typeof text === "string" && !text.trim()) issues.push({ path, message: "must not be blank." }); });
  return issues;
}

function parseInput(input: string | unknown): { value?: unknown; issue?: ValidationIssue } {
  if (typeof input !== "string") return { value: input };
  const text = input.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try { return { value: JSON.parse(text) }; }
  catch { return { issue: { path: "session", message: "is not valid JSON. Send the complete JSON object or file again." } }; }
}

export function validateSession(input: string | unknown, options: { now?: Date; allowDateOutsideWindow?: boolean } = {}): ValidationResult {
  const parsed = parseInput(input);
  if (parsed.issue) return { ok: false, summary: `I couldn't import this session: ${parsed.issue.message}`, issues: [parsed.issue] };
  const value = parsed.value;
  if (!validateSchema(value)) {
    const issues = (validateSchema.errors ?? []).map(schemaIssue);
    return { ok: false, summary: formatValidationError(issues), issues };
  }
  const issues = semanticIssues(value, options.now ?? new Date(), options.allowDateOutsideWindow ?? false);
  return issues.length ? { ok: false, summary: formatValidationError(issues), issues } : { ok: true, value };
}

export function formatValidationError(issues: ValidationIssue[]) {
  const details = issues.slice(0, 5).map((issue) => `• ${issue.path}: ${issue.message}`).join("\n");
  const more = issues.length > 5 ? `\n• …and ${issues.length - 5} more issue(s).` : "";
  return `I couldn't import this session yet. Please fix:\n${details}${more}`;
}
