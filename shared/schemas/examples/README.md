# Session schema examples

- `session-valid.json` is the canonical realistic example from the master plan.
- `session-invalid-missing-summary.json` omits the required `session_summary` field.
- `session-invalid-learning-item-type.json` uses `slang`, which is not a v1 learning-item type.
- `session-invalid-duration-type.json` uses a string where `duration_minutes` requires an integer or `null`.

Run `npm run validate:examples` from the repository root. The command validates
the valid fixture and verifies that each invalid fixture fails for the documented
field and JSON Schema keyword.
