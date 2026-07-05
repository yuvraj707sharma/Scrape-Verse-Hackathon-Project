"""Gemini extraction pipeline: sentiment, entities, topic, summary + embedding."""
import json
import os

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

_TRACKED = [e.strip() for e in os.getenv("TRACKED_ENTITIES", "").split(",") if e.strip()]

_EXTRACTION_MODEL = "gemini-2.0-flash-lite"
_EMBED_MODEL = "models/text-embedding-004"  # 768-dim

# JECRC-specific topic taxonomy
TOPIC_CATEGORIES = [
    "placements",
    "fees",
    "faculty",
    "hostel life",
    "infrastructure",
    "academic quality",
    "admission/reputation",
    "general",
]

# Controlled program list — Gemini maps free text to one of these
PROGRAM_LIST = [
    "CSE",
    "Mechanical Engineering",
    "Civil Engineering",
    "MBA",
    "BSc Nursing",
    "BPT (Physiotherapy)",
    "Electronics",
    "other",
]

_SCHEMA = {
    "type": "object",
    "properties": {
        "sentiment_score":    {"type": "number", "minimum": -1, "maximum": 1},
        "topic_category":     {"type": "string", "enum": TOPIC_CATEGORIES},
        "entities_mentioned": {"type": "array",  "items": {"type": "string"}},
        "key_phrase_summary": {"type": "string", "maxLength": 300},
        "is_flagged":         {"type": "boolean"},
        "escalation_reason":  {"type": "string", "maxLength": 500},
        "program":            {"type": "string", "enum": PROGRAM_LIST + ["null"]},
        "positives":          {"type": "array",  "items": {"type": "string"}},
        "negatives":          {"type": "array",  "items": {"type": "string"}},
    },
    "required": [
        "sentiment_score", "topic_category", "entities_mentioned",
        "key_phrase_summary", "is_flagged", "positives", "negatives",
    ],
}

_PROMPT_TEMPLATE = """You are a competitive-intelligence analyst for JECRC University, Jaipur.
Analyse the following user-generated text and return ONLY valid JSON matching the schema.

Tracked entities (include only those actually mentioned): {entities}

Known academic programs — map any mentioned course/department to exactly one of:
{programs}
Use "null" if no specific program is mentioned.

Flag rules — set is_flagged=true ONLY if the text describes:
- An urgent operational or safety issue (broken infrastructure, health risk)
- A collective action risk (student protest, mass complaint, boycott threat)
- A serious reputational threat (viral negative post, media coverage of scandal)
Do NOT flag merely negative sentiment. If is_flagged=true, write a one-sentence
escalation_reason. If is_flagged=false, omit escalation_reason or set it to "".

Text:
\"\"\"
{text}
\"\"\"

JSON schema:
{schema}
"""


def extract(text: str, tracked_entities: list[str] | None = None) -> dict:
    """Call Gemini Flash Lite and return structured extraction dict."""
    entities = tracked_entities if tracked_entities is not None else _TRACKED
    model = genai.GenerativeModel(
        _EXTRACTION_MODEL,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            response_schema=_SCHEMA,
        ),
    )
    prompt = _PROMPT_TEMPLATE.format(
        entities=", ".join(entities) or "none specified",
        programs=", ".join(PROGRAM_LIST),
        text=text[:4000],
        schema=json.dumps(_SCHEMA, indent=2),
    )
    response = model.generate_content(prompt)
    result = json.loads(response.text)
    # Normalise: if program is the string "null" treat as None
    if result.get("program") == "null":
        result["program"] = None
    # Ensure arrays are always present
    result.setdefault("positives", [])
    result.setdefault("negatives", [])
    result.setdefault("is_flagged", False)
    result.setdefault("escalation_reason", None)
    return result


def embed(text: str) -> list[float]:
    """Return 768-dim embedding vector for *text*."""
    result = genai.embed_content(
        model=_EMBED_MODEL,
        content=text[:2000],
        task_type="RETRIEVAL_DOCUMENT",
    )
    return result["embedding"]
