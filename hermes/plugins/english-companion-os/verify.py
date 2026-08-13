"""Dependency-free smoke checks for the safe CLI bridge."""
import json
from unittest.mock import patch
from ecos_tool import ingest_english_session, prepare_daily_review, review_schedule_tick, save_review_result, weekly_report_tick

assert json.loads(ingest_english_session({}))["ok"] is False
with patch("ecos_tool.subprocess.run", side_effect=OSError("secret")):
    result = json.loads(ingest_english_session({"json_text": "{}"}))
assert result["ok"] is False and "secret" not in result["message"]
completed = type("Completed", (), {"stdout": '{"ok": true, "message": "saved", "memoryCandidates": []}'})()
with patch("ecos_tool.subprocess.run", return_value=completed):
    assert json.loads(ingest_english_session({"json_text": "{}"}))["message"] == "saved"
print("PASS Hermes user-plugin bridge")

review = type("Completed", (), {"stdout": '{"ok": true, "plan": [], "prompt": "generate"}'})()
with patch("ecos_tool.subprocess.run", return_value=review):
    assert json.loads(prepare_daily_review({}))["prompt"] == "generate"

result = type("Completed", (), {"stdout": '{"ok": true, "data": {"event_id": "e"}}'})()
with patch("ecos_tool.subprocess.run", return_value=result):
    assert json.loads(save_review_result({"question": {}, "answer": "a", "evaluation": {}}))["ok"] is True

schedule = type("Completed", (), {"stdout": '{"ok": true, "data": {"action": "silent"}}'})()
with patch("ecos_tool.subprocess.run", return_value=schedule):
    assert json.loads(review_schedule_tick({}))["ok"] is True

weekly = type("Completed", (), {"stdout": '{"ok": true, "claim": {"action": "silent"}, "message": null}'})()
with patch("ecos_tool.subprocess.run", return_value=weekly):
    assert json.loads(weekly_report_tick({}))["claim"]["action"] == "silent"
