export type SessionExport = {
  schema_version: "1.0";
  session_date: string;
  session_start_time: string | null;
  duration_minutes: number | null;
  topics: string[];
  session_summary: string;
  learning_items: Array<Record<string, unknown>>;
  corrections: Array<Record<string, unknown>>;
  recurring_mistakes: Array<Record<string, unknown>>;
  pronunciation_notes: Array<Record<string, unknown>>;
  shadowing: Array<Record<string, unknown>>;
  next_session_focus: string | null;
  memory_candidates: string[];
};

export type ValidationIssue = { path: string; message: string };
export type ValidationResult =
  | { ok: true; value: SessionExport }
  | { ok: false; summary: string; issues: ValidationIssue[] };
