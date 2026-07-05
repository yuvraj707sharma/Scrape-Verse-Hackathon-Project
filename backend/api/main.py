"""FastAPI application — competitive intelligence endpoints."""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from db.connection import get_conn
from backend.pipeline.extractor import embed

app = FastAPI(title="Social Listener API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class KeywordIn(BaseModel):
    keyword: str
    category: str = "general"  # brand | competitor | program | general


class CompetitorIn(BaseModel):
    name: str
    short_name: str = ""
    website_url: str = ""


class EscalationIn(BaseModel):
    escalation_status: str  # investigating | resolved | none


class ManualMentionIn(BaseModel):
    text: str
    source_platform: str = "manual_log"
    author_handle: str = ""
    source_url: str = ""


# ---------------------------------------------------------------------------
# GET /sources — mention count, last ingested, avg sentiment per platform
# ---------------------------------------------------------------------------
@app.get("/sources")
def get_sources():
    sql = """
        SELECT   m.source_platform                    AS platform,
                 COUNT(*)                             AS mention_count,
                 MAX(m.created_at)                    AS last_ingested_at,
                 AVG(ma.sentiment_score)              AS avg_sentiment
        FROM     mentions m
        LEFT JOIN mentions_analyzed ma ON ma.mention_id = m.id
        GROUP BY m.source_platform
        ORDER BY mention_count DESC
    """
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(sql)
        rows = cursor.fetchall()
        for r in rows:
            if r.get("last_ingested_at"):
                r["last_ingested_at"] = r["last_ingested_at"].isoformat()
        return rows
    finally:
        cursor.close()
        conn.close()


# ---------------------------------------------------------------------------
# GET /matrix — sentiment aggregated by topic_category, optional platform filter
# ---------------------------------------------------------------------------
@app.get("/matrix")
def get_matrix(source_platform: str | None = None):
    conditions = ["1=1"]
    params: list = []
    if source_platform:
        conditions.append("m.source_platform = %s")
        params.append(source_platform)

    sql = f"""
        SELECT   ma.topic_category,
                 AVG(ma.sentiment_score)  AS avg_sentiment,
                 COUNT(*)                 AS mention_count
        FROM     mentions_analyzed ma
        JOIN     mentions m ON m.id = ma.mention_id
        WHERE    {" AND ".join(conditions)}
        GROUP BY ma.topic_category
        ORDER BY mention_count DESC
    """
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(sql, params)
        rows = cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

    # Fetch top-3 sample source_urls per topic in a second query
    if not rows:
        return rows
    topics = [r["topic_category"] for r in rows]
    placeholders = ",".join(["%s"] * len(topics))
    url_params = list(params) + topics  # platform filter (if any) + topics
    platform_cond = "AND m.source_platform = %s" if source_platform else ""
    url_sql = f"""
        SELECT ma.topic_category, m.source_url
        FROM   mentions_analyzed ma
        JOIN   mentions m ON m.id = ma.mention_id
        WHERE  m.source_url IS NOT NULL
          {platform_cond}
          AND ma.topic_category IN ({placeholders})
        ORDER BY ma.sentiment_score DESC
    """
    conn2 = get_conn()
    cursor2 = conn2.cursor(dictionary=True)
    try:
        cursor2.execute(url_sql, url_params)
        url_rows = cursor2.fetchall()
    finally:
        cursor2.close()
        conn2.close()

    # Group top-3 urls per topic
    from collections import defaultdict
    url_map: dict[str, list] = defaultdict(list)
    for ur in url_rows:
        bucket = url_map[ur["topic_category"]]
        if len(bucket) < 3 and ur["source_url"] not in bucket:
            bucket.append(ur["source_url"])

    for r in rows:
        r["sample_source_urls"] = url_map.get(r["topic_category"], [])
    return rows


# ---------------------------------------------------------------------------
# GET /mentions — filtered raw mentions
# ---------------------------------------------------------------------------
@app.get("/mentions")
def get_mentions(
    platform: str | None = None,
    sentiment_min: float = Query(-1.0, ge=-1, le=1),
    sentiment_max: float = Query(1.0, ge=-1, le=1),
    date_from: str | None = None,
    date_to: str | None = None,
    limit: int = Query(50, le=200),
):
    conditions = ["1=1"]
    params: list = []

    if platform:
        conditions.append("m.source_platform = %s")
        params.append(platform)
    conditions.append("ma.sentiment_score BETWEEN %s AND %s")
    params.extend([sentiment_min, sentiment_max])
    if date_from:
        conditions.append("m.posted_at >= %s")
        params.append(date_from)
    if date_to:
        conditions.append("m.posted_at <= %s")
        params.append(date_to)

    sql = f"""
        SELECT m.id, m.source_platform, m.source_url, m.author_handle,
               m.text_content, m.engagement_score, m.posted_at,
               ma.sentiment_score, ma.topic_category,
               ma.entities_mentioned, ma.key_phrase_summary
        FROM   mentions m
        JOIN   mentions_analyzed ma ON ma.mention_id = m.id
        WHERE  {" AND ".join(conditions)}
        ORDER  BY m.posted_at DESC
        LIMIT  %s
    """
    params.append(limit)

    conn = get_conn()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(sql, params)
        rows = cursor.fetchall()
        for r in rows:
            if isinstance(r.get("entities_mentioned"), str):
                r["entities_mentioned"] = json.loads(r["entities_mentioned"])
            if r.get("posted_at"):
                r["posted_at"] = r["posted_at"].isoformat()
        return rows
    finally:
        cursor.close()
        conn.close()


# ---------------------------------------------------------------------------
# GET /search — semantic search via VECTOR DISTANCE (MySQL 9+)
# ---------------------------------------------------------------------------
@app.get("/search")
def semantic_search(q: str, limit: int = Query(10, le=50)):
    vec = embed(q)
    vec_literal = "[" + ",".join(f"{v:.8f}" for v in vec) + "]"

    sql = """
        SELECT m.id, m.text_content, m.source_platform, m.posted_at,
               ma.sentiment_score, ma.topic_category,
               DISTANCE(ma.embedding, %s, 'COSINE') AS dist
        FROM   mentions_analyzed ma
        JOIN   mentions m ON m.id = ma.mention_id
        ORDER  BY dist ASC
        LIMIT  %s
    """
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(sql, (vec_literal, limit))
        rows = cursor.fetchall()
        for r in rows:
            if r.get("posted_at"):
                r["posted_at"] = r["posted_at"].isoformat()
        return rows
    finally:
        cursor.close()
        conn.close()


# ---------------------------------------------------------------------------
# STEP 3 — GET /mentions updated to include new fields
# (replace the existing /mentions to also return new columns)
# ---------------------------------------------------------------------------
@app.get("/mentions/full")
def get_mentions_full(
    platform: str | None = None,
    topic: str | None = None,
    program: str | None = None,
    flagged_only: bool = False,
    sentiment_min: float = Query(-1.0, ge=-1, le=1),
    sentiment_max: float = Query(1.0, ge=-1, le=1),
    date_from: str | None = None,
    date_to: str | None = None,
    limit: int = Query(50, le=200),
):
    """Extended mentions endpoint returning all new fields."""
    conditions = ["1=1"]
    params: list = []

    if platform:
        conditions.append("m.source_platform = %s")
        params.append(platform)
    if topic:
        conditions.append("ma.topic_category = %s")
        params.append(topic)
    if program:
        conditions.append("ma.program = %s")
        params.append(program)
    if flagged_only:
        conditions.append("ma.is_flagged = TRUE")
    conditions.append("ma.sentiment_score BETWEEN %s AND %s")
    params.extend([sentiment_min, sentiment_max])
    if date_from:
        conditions.append("m.posted_at >= %s")
        params.append(date_from)
    if date_to:
        conditions.append("m.posted_at <= %s")
        params.append(date_to)

    sql = f"""
        SELECT m.id, m.source_platform, m.source_url, m.author_handle,
               m.text_content, m.engagement_score, m.posted_at,
               ma.sentiment_score, ma.topic_category,
               ma.entities_mentioned, ma.key_phrase_summary,
               ma.is_flagged, ma.escalation_reason, ma.escalation_status,
               ma.program, ma.positives, ma.negatives
        FROM   mentions m
        JOIN   mentions_analyzed ma ON ma.mention_id = m.id
        WHERE  {" AND ".join(conditions)}
        ORDER  BY m.posted_at DESC
        LIMIT  %s
    """
    params.append(limit)

    conn = get_conn()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(sql, params)
        rows = cursor.fetchall()
        for r in rows:
            for field in ("entities_mentioned", "positives", "negatives"):
                if isinstance(r.get(field), str):
                    r[field] = json.loads(r[field])
                elif r.get(field) is None:
                    r[field] = []
            if r.get("posted_at"):
                r["posted_at"] = r["posted_at"].isoformat()
            r["is_flagged"] = bool(r.get("is_flagged"))
        return rows
    finally:
        cursor.close()
        conn.close()


# ---------------------------------------------------------------------------
# STEP 3 — Keyword management
# ---------------------------------------------------------------------------
def _seed_keywords_from_env():
    """Populate tracked_keywords from TRACKED_ENTITIES env var if table is empty."""
    env_val = os.getenv("TRACKED_ENTITIES", "")
    entities = [e.strip() for e in env_val.split(",") if e.strip()]
    if not entities:
        return
    conn = get_conn()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT COUNT(*) FROM tracked_keywords")
        if cursor.fetchone()[0] == 0:
            for kw in entities:
                cursor.execute(
                    "INSERT IGNORE INTO tracked_keywords (keyword, category) VALUES (%s, %s)",
                    (kw, "brand"),
                )
            conn.commit()
            print(f"[seed] seeded {len(entities)} keywords from TRACKED_ENTITIES env var")
    finally:
        cursor.close()
        conn.close()


def _seed_competitors_from_env():
    """Populate tracked_competitors from TRACKED_ENTITIES env var if table is empty."""
    env_val = os.getenv("TRACKED_COMPETITORS", "")
    entries = [e.strip() for e in env_val.split(",") if e.strip()]
    if not entries:
        return
    conn = get_conn()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT COUNT(*) FROM tracked_competitors")
        if cursor.fetchone()[0] == 0:
            for entry in entries:
                cursor.execute(
                    "INSERT IGNORE INTO tracked_competitors (name) VALUES (%s)",
                    (entry,),
                )
            conn.commit()
            print(f"[seed] seeded {len(entries)} competitors from TRACKED_COMPETITORS env var")
    finally:
        cursor.close()
        conn.close()


@app.on_event("startup")
def on_startup():
    _seed_keywords_from_env()
    _seed_competitors_from_env()


@app.get("/keywords")
def get_keywords():
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, keyword, category, created_at FROM tracked_keywords ORDER BY created_at DESC")
        rows = cursor.fetchall()
        for r in rows:
            if r.get("created_at"):
                r["created_at"] = r["created_at"].isoformat()
        return rows
    finally:
        cursor.close()
        conn.close()


@app.post("/keywords", status_code=201)
def add_keyword(body: KeywordIn):
    valid_categories = {"brand", "competitor", "program", "general"}
    if body.category not in valid_categories:
        raise HTTPException(400, f"category must be one of {valid_categories}")
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "INSERT INTO tracked_keywords (keyword, category) VALUES (%s, %s)",
            (body.keyword.strip(), body.category),
        )
        conn.commit()
        new_id = cursor.lastrowid
        cursor.execute("SELECT id, keyword, category, created_at FROM tracked_keywords WHERE id = %s", (new_id,))
        row = cursor.fetchone()
        if row and row.get("created_at"):
            row["created_at"] = row["created_at"].isoformat()
        return row
    except Exception as e:
        if "Duplicate" in str(e):
            raise HTTPException(409, "Keyword already exists")
        raise
    finally:
        cursor.close()
        conn.close()


@app.delete("/keywords/{keyword_id}", status_code=204)
def delete_keyword(keyword_id: int):
    conn = get_conn()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM tracked_keywords WHERE id = %s", (keyword_id,))
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(404, "Keyword not found")
    finally:
        cursor.close()
        conn.close()


# ---------------------------------------------------------------------------
# STEP 3 — Competitor management
# ---------------------------------------------------------------------------
@app.get("/competitors")
def get_competitors():
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT id, name, short_name, website_url, created_at FROM tracked_competitors ORDER BY created_at DESC"
        )
        rows = cursor.fetchall()
        for r in rows:
            if r.get("created_at"):
                r["created_at"] = r["created_at"].isoformat()
        return rows
    finally:
        cursor.close()
        conn.close()


@app.post("/competitors", status_code=201)
def add_competitor(body: CompetitorIn):
    if not body.name.strip():
        raise HTTPException(400, "name is required")
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "INSERT INTO tracked_competitors (name, short_name, website_url) VALUES (%s, %s, %s)",
            (body.name.strip(), body.short_name.strip(), body.website_url.strip()),
        )
        conn.commit()
        new_id = cursor.lastrowid
        cursor.execute(
            "SELECT id, name, short_name, website_url, created_at FROM tracked_competitors WHERE id = %s",
            (new_id,),
        )
        row = cursor.fetchone()
        if row and row.get("created_at"):
            row["created_at"] = row["created_at"].isoformat()
        return row
    except Exception as e:
        if "Duplicate" in str(e):
            raise HTTPException(409, "Competitor already exists")
        raise
    finally:
        cursor.close()
        conn.close()


@app.delete("/competitors/{competitor_id}", status_code=204)
def delete_competitor(competitor_id: int):
    conn = get_conn()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM tracked_competitors WHERE id = %s", (competitor_id,))
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(404, "Competitor not found")
    finally:
        cursor.close()
        conn.close()


# ---------------------------------------------------------------------------
# STEP 4 — Risk alerts endpoints
# ---------------------------------------------------------------------------
@app.get("/alerts")
def get_alerts(status: str | None = None):
    """Return flagged mentions. Optionally filter by escalation_status."""
    conditions = ["ma.is_flagged = TRUE"]
    params: list = []
    if status:
        conditions.append("ma.escalation_status = %s")
        params.append(status)

    sql = f"""
        SELECT m.id, m.source_platform, m.source_url, m.author_handle,
               m.text_content, m.posted_at,
               ma.sentiment_score, ma.topic_category, ma.program,
               ma.escalation_reason, ma.escalation_status,
               ma.positives, ma.negatives
        FROM   mentions_analyzed ma
        JOIN   mentions m ON m.id = ma.mention_id
        WHERE  {" AND ".join(conditions)}
        ORDER  BY m.posted_at DESC
    """
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(sql, params)
        rows = cursor.fetchall()
        for r in rows:
            for field in ("positives", "negatives"):
                if isinstance(r.get(field), str):
                    r[field] = json.loads(r[field])
                elif r.get(field) is None:
                    r[field] = []
            if r.get("posted_at"):
                r["posted_at"] = r["posted_at"].isoformat()
        return rows
    finally:
        cursor.close()
        conn.close()


@app.patch("/alerts/{mention_id}")
def update_alert_status(mention_id: int, body: EscalationIn):
    valid = {"none", "investigating", "resolved"}
    if body.escalation_status not in valid:
        raise HTTPException(400, f"escalation_status must be one of {valid}")
    conn = get_conn()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE mentions_analyzed SET escalation_status = %s WHERE mention_id = %s AND is_flagged = TRUE",
            (body.escalation_status, mention_id),
        )
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(404, "Flagged mention not found")
        return {"mention_id": mention_id, "escalation_status": body.escalation_status}
    finally:
        cursor.close()
        conn.close()


# ---------------------------------------------------------------------------
# STEP 5 — Manual mention entry
# ---------------------------------------------------------------------------
@app.post("/mentions/manual", status_code=201)
def add_manual_mention(body: ManualMentionIn):
    """Insert a manually pasted mention, run extraction + embedding synchronously."""
    from datetime import datetime, timezone
    from backend.pipeline.extractor import extract, embed as embed_text

    if not body.text.strip():
        raise HTTPException(400, "text is required")

    # Load tracked entities for extraction context
    conn = get_conn()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT keyword FROM tracked_keywords")
        tracked = [r[0] for r in cursor.fetchall()]
    finally:
        cursor.close()
        conn.close()

    # 1. Insert into mentions
    conn = get_conn()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """INSERT INTO mentions
               (source_platform, source_url, author_handle, text_content, posted_at, raw_metadata)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (
                body.source_platform,
                body.source_url or None,
                body.author_handle or None,
                body.text.strip(),
                datetime.now(timezone.utc),
                json.dumps({"source": "manual_entry"}),
            ),
        )
        conn.commit()
        mention_id = cursor.lastrowid
    finally:
        cursor.close()
        conn.close()

    # 2. Extract + embed synchronously
    try:
        result = extract(body.text.strip(), tracked_entities=tracked)
        vec = embed_text(body.text.strip())
        vec_literal = "[" + ",".join(f"{v:.8f}" for v in vec) + "]"
    except Exception as e:
        raise HTTPException(500, f"Extraction failed: {e}")

    # 3. Insert into mentions_analyzed
    conn = get_conn()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """INSERT INTO mentions_analyzed
               (mention_id, sentiment_score, topic_category, entities_mentioned,
                key_phrase_summary, embedding, is_flagged, escalation_reason,
                program, positives, negatives)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (
                mention_id,
                result["sentiment_score"],
                result["topic_category"],
                json.dumps(result["entities_mentioned"]),
                result["key_phrase_summary"],
                vec_literal,
                bool(result.get("is_flagged", False)),
                result.get("escalation_reason") or None,
                result.get("program") or None,
                json.dumps(result.get("positives", [])),
                json.dumps(result.get("negatives", [])),
            ),
        )
        conn.commit()
    finally:
        cursor.close()
        conn.close()

    return {
        "mention_id": mention_id,
        "sentiment_score": result["sentiment_score"],
        "topic_category": result["topic_category"],
        "is_flagged": result.get("is_flagged", False),
        "program": result.get("program"),
        "key_phrase_summary": result["key_phrase_summary"],
        "positives": result.get("positives", []),
        "negatives": result.get("negatives", []),
    }


# ---------------------------------------------------------------------------
# STEP 7 — Export
# ---------------------------------------------------------------------------
@app.get("/export")
def export_all():
    """Return all mentions + analysis as a JSON dump for download."""
    sql = """
        SELECT m.id, m.source_platform, m.source_url, m.author_handle,
               m.text_content, m.engagement_score, m.posted_at, m.created_at,
               ma.sentiment_score, ma.topic_category, ma.entities_mentioned,
               ma.key_phrase_summary, ma.is_flagged, ma.escalation_reason,
               ma.escalation_status, ma.program, ma.positives, ma.negatives
        FROM   mentions m
        LEFT JOIN mentions_analyzed ma ON ma.mention_id = m.id
        ORDER  BY m.posted_at DESC
    """
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(sql)
        rows = cursor.fetchall()
        for r in rows:
            for field in ("entities_mentioned", "positives", "negatives"):
                if isinstance(r.get(field), str):
                    r[field] = json.loads(r[field])
                elif r.get(field) is None:
                    r[field] = []
            for field in ("posted_at", "created_at"):
                if r.get(field):
                    r[field] = r[field].isoformat()
            if r.get("is_flagged") is not None:
                r["is_flagged"] = bool(r["is_flagged"])
        return {"total": len(rows), "mentions": rows}
    finally:
        cursor.close()
        conn.close()


# ---------------------------------------------------------------------------
# STEP 3 — Program insights aggregation
# ---------------------------------------------------------------------------
@app.get("/programs")
def get_programs():
    """Sentiment counts grouped by program, only programs with >= 1 mention."""
    sql = """
        SELECT   ma.program,
                 COUNT(*)                                          AS mention_count,
                 AVG(ma.sentiment_score)                          AS avg_sentiment,
                 SUM(ma.sentiment_score > 0.2)                    AS positive_count,
                 SUM(ma.sentiment_score < -0.2)                   AS negative_count,
                 SUM(ma.sentiment_score BETWEEN -0.2 AND 0.2)     AS neutral_count
        FROM     mentions_analyzed ma
        WHERE    ma.program IS NOT NULL
        GROUP BY ma.program
        ORDER BY mention_count DESC
    """
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(sql)
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()
