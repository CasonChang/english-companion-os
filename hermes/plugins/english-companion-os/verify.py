"""Dependency-free smoke checks for the safe CLI bridge."""
import json
from unittest.mock import patch
from ecos_tool import ingest_english_session

assert json.loads(ingest_english_session({}))["ok"] is False
with patch("ecos_tool.subprocess.run", side_effect=OSError("secret")):
    result = json.loads(ingest_english_session({"json_text": "{}"}))
assert result["ok"] is False and "secret" not in result["message"]
completed = type("Completed", (), {"stdout": '{"ok": true, "message": "saved", "memoryCandidates": []}'})()
with patch("ecos_tool.subprocess.run", return_value=completed):
    assert json.loads(ingest_english_session({"json_text": "{}"}))["message"] == "saved"
print("PASS Hermes user-plugin bridge")
