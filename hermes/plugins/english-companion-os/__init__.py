"""User plugin for English Companion session ingestion."""
from pathlib import Path
from .ecos_tool import ingest_english_session, override_review_rating, prepare_daily_review, review_schedule_tick, save_review_result, update_review_settings, weekly_report_tick

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
    review_schema = {
        "name": "prepare_daily_review",
        "description": "Select a balanced, non-repeating daily English review plan from Supabase. Call when starting a review.",
        "parameters": {"type": "object", "properties": {}, "additionalProperties": False},
    }
    ctx.register_tool(name="prepare_daily_review", toolset="english_companion", schema=review_schema, handler=prepare_daily_review)
    result_schema = {
        "name": "save_review_result", "description": "Persist one answered Telegram review and update its SRS item atomically.",
        "parameters": {"type":"object","properties":{"question":{"type":"object"},"answer":{"type":"string"},"evaluation":{"type":"object","properties":{"rating":{"enum":["again","hard","good","easy"]},"feedback":{"type":"string"}},"required":["rating","feedback"]}},"required":["question","answer","evaluation"],"additionalProperties":False},
    }
    ctx.register_tool(name="save_review_result", toolset="english_companion", schema=result_schema, handler=save_review_result)
    override_schema = {"name":"override_review_rating","description":"Override the immediately previous Telegram review rating within 15 minutes.","parameters":{"type":"object","properties":{"eventId":{"type":"string"},"rating":{"enum":["again","hard","good","easy"]}},"required":["eventId","rating"],"additionalProperties":False}}
    ctx.register_tool(name="override_review_rating", toolset="english_companion", schema=override_schema, handler=override_review_rating)
    tick_schema = {"name":"review_schedule_tick","description":"Atomically check whether the configured daily review should fire now.","parameters":{"type":"object","properties":{},"additionalProperties":False}}
    ctx.register_tool(name="review_schedule_tick", toolset="english_companion", schema=tick_schema, handler=review_schedule_tick)
    settings_schema = {"name":"update_review_settings","description":"Update explicitly requested daily review settings. Omit values the user did not change.","parameters":{"type":"object","properties":{"timezone":{"type":"string"},"reviewTime":{"type":"string","pattern":"^([01]?[0-9]|2[0-3]):[0-5][0-9]$"},"enabled":{"type":"boolean"},"questionCount":{"type":"integer","minimum":3,"maximum":5}},"additionalProperties":False}}
    ctx.register_tool(name="update_review_settings", toolset="english_companion", schema=settings_schema, handler=update_review_settings)
    weekly_schema = {"name":"weekly_report_tick","description":"Atomically check the configured weekly schedule, generate and save a due report, and return its Telegram message.","parameters":{"type":"object","properties":{},"additionalProperties":False}}
    ctx.register_tool(name="weekly_report_tick", toolset="english_companion", schema=weekly_schema, handler=weekly_report_tick)
    ctx.register_skill(name="english-learning", path=Path(__file__).parent / "skills" / "english-learning" / "SKILL.md")
