# Recover JSON from an existing GPT-Live conversation

Use this only when the conversation happened before the English Companion Project
prompt was installed. For normal future sessions, use
[`english-coach-project-prompt.md`](english-coach-project-prompt.md) and ask
“Save today's session” after its interactive summary and shadowing.

## How to use it

1. Return to the same ChatGPT conversation that contains the English practice.
2. Paste the entire prompt below as one message.
3. ChatGPT may ask you to confirm facts it cannot know. Answer those questions;
   do not let it guess a start time, duration, mistake, or pronunciation issue.
4. Copy only the JSON inside the final fenced code block, or download it as a
   `.json` file if ChatGPT offers a download.

## Paste this message into the existing conversation

```text
Please recover an English Companion session export from the conversation above.

Use only evidence that is actually present in this conversation. Do not invent
anything. If the session start time or duration cannot be known from the visible
conversation, use null. Include only corrections and pronunciation issues that
were genuinely observed in this conversation. If none were observed, use empty
arrays. Keep useful learning items even if the conversation was short.

Before producing JSON, ask me only the minimum factual questions needed to avoid
guessing. When those questions are answered, output one short confirmation line,
then exactly one fenced JSON code block, with nothing after it.

The JSON must contain every key below and follow these rules:

- schema_version must be "1.0".
- session_date must be the actual local conversation date in YYYY-MM-DD format.
- session_start_time is HH:MM or null.
- duration_minutes is an integer from 1 to 240 or null.
- topics contains 1–10 short topic labels.
- session_summary is a factual 2–5 sentence summary.
- learning item type must be one of: vocabulary, phrase, phrasal_verb,
  collocation, natural_expression, idiom, pattern.
- importance must be high, medium, low, or null.
- correction and recurring-mistake category must be one of: articles,
  verb_tense, prepositions, plurals, word_choice, word_order,
  subject_verb_agreement, unnatural_phrasing, pronunciation, other; correction
  category may also be null.
- Every key is required. Use null for an unknown nullable scalar and [] for an
  empty collection.

Use exactly this object shape:
{
  "schema_version": "1.0",
  "session_date": "YYYY-MM-DD",
  "session_start_time": null,
  "duration_minutes": null,
  "topics": ["topic"],
  "session_summary": "Factual summary of this conversation.",
  "learning_items": [
    {
      "type": "natural_expression",
      "text": "item from this conversation",
      "meaning": "plain-English meaning",
      "example": "natural example grounded in this conversation",
      "note": null,
      "importance": "medium"
    }
  ],
  "corrections": [
    {
      "original": "what I actually said",
      "corrected": "the natural version",
      "explanation": "one concise sentence",
      "category": "unnatural_phrasing"
    }
  ],
  "recurring_mistakes": [
    {
      "category": "articles",
      "description": "a pattern that genuinely recurred",
      "examples": ["actual example from this conversation"]
    }
  ],
  "pronunciation_notes": [
    {
      "word_or_sound": "an actually observed word or sound",
      "note": "the actual pronunciation guidance"
    }
  ],
  "shadowing": [],
  "next_session_focus": "one evidence-based focus or null",
  "memory_candidates": ["only personal facts explicitly shared and worth remembering"]
}

Do not copy placeholder example content into the result. Replace it with facts
from this conversation, or use []/null where the contract permits it.
```

## What happens next

Until Hermes ingestion is installed, send the resulting JSON to the implementation
agent for schema validation and a one-time import. Once Hermes is installed, the
normal path is simply to send that JSON file to the dedicated Hermes Telegram
chat.
