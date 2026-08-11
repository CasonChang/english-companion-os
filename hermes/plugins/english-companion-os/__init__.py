"""User plugin for English Companion session ingestion."""
from pathlib import Path
from .ecos_tool import ingest_english_session

def register(ctx):
    schema = {
        "name": "ingest_english_session",
        "description": "Validate and save a complete English Companion session JSON attachment or pasted JSON. Call immediately when such a payload arrives.",
        "parameters": {
            "type": "object",
            "properties": {
                "file_path": {"type": "string", "description": "Hermes-cached path of the Telegram .json attachment."},
                "json_text": {"type": "string", "description": "Complete pasted session JSON text."},
                "confirmed_date": {"type": "boolean", "description": "True only after the user explicitly confirms a date outside the seven-day window."}
            },
            "anyOf": [{"required": ["file_path"]}, {"required": ["json_text"]}],
            "additionalProperties": False
        }
    }
    ctx.register_tool(name="ingest_english_session", toolset="english_companion", schema=schema, handler=ingest_english_session)
    ctx.register_skill(name="english-learning", path=Path(__file__).parent / "skills" / "english-learning" / "SKILL.md")
