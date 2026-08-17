"""Analysis worker: process unanalysed mentions through Gemini extraction."""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

from db.connection import get_conn
from backend.pipeline.extractor import extract, embed

_FETCH_SQL = """
    SELECT m.id, m.text_content
    FROM   mentions m
    LEFT JOIN mentions_analyzed ma ON ma.mention_id = m.id
    WHERE  ma.id IS NULL
    LIMIT  %s
"""

_INSERT_SQL = """
    INSERT INTO mentions_analyzed
        (mention_id, sentiment_score, topic_category,
         entities_mentioned, key_phrase_summary, embedding,
         is_flagged, escalation_reason, program, positives, negatives)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
"""


def _vec_to_mysql(vec: list[float]) -> str:
    return "[" + ",".join(f"{v:.8f}" for v in vec) + "]"


def _get_tracked_entities() -> list[str]:
    """Load tracked entities from DB; fall back to TRACKED_ENTITIES env var."""
    conn = get_conn()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT keyword FROM tracked_keywords")
        rows = cursor.fetchall()
        if rows:
            return [r[0] for r in rows]
    except Exception:
        pass
    finally:
        cursor.close()
        conn.close()
    # Fallback to env var
    return [e.strip() for e in os.getenv("TRACKED_ENTITIES", "").split(",") if e.strip()]


def run_analysis(batch_size: int = 50):
    tracked = _get_tracked_entities()
    conn = get_conn()
    cursor = conn.cursor()
    try:
        cursor.execute(_FETCH_SQL, (batch_size,))
        rows = cursor.fetchall()
        print(f"[analysis] processing {len(rows)} mentions")

        for mention_id, text in rows:
            try:
                result = extract(text, tracked_entities=tracked)
                vec = embed(text)
                cursor.execute(
                    _INSERT_SQL,
                    (
                        mention_id,
                        result["sentiment_score"],
                        result["topic_category"],
                        json.dumps(result["entities_mentioned"]),
                        result["key_phrase_summary"],
                        _vec_to_mysql(vec),
                        bool(result.get("is_flagged", False)),
                        result.get("escalation_reason") or None,
                        result.get("program") or None,
                        json.dumps(result.get("positives", [])),
                        json.dumps(result.get("negatives", [])),
                    ),
                )
            except Exception as e:
                print(f"[analysis] mention {mention_id} failed: {e}")

        conn.commit()
        print(f"[analysis] done")
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    run_analysis()
