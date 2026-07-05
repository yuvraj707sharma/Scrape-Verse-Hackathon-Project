"""Ingestion worker: fetch mentions from all adapters and persist to MySQL."""
import asyncio
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv

from db.connection import get_conn
from ingestion.adapters.base import Mention
from ingestion.adapters.reddit import RedditAdapter
from ingestion.adapters.spider_web import SpiderWebAdapter
from ingestion.adapters.youtube import YouTubeAdapter
from ingestion.adapters.news import NewsAdapter
from ingestion.adapters.discovery import DiscoveryAdapter

load_dotenv()

_INSERT_SQL = """
    INSERT INTO mentions
        (source_platform, source_url, author_handle, text_content,
         engagement_score, posted_at, raw_metadata)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
"""


def _save_mentions(mentions: list[Mention]) -> list[int]:
    """Bulk-insert mentions, return list of new row IDs."""
    ids = []
    conn = get_conn()
    cursor = conn.cursor()
    try:
        for m in mentions:
            cursor.execute(
                _INSERT_SQL,
                (
                    m.source_platform,
                    m.source_url,
                    m.author_handle,
                    m.text_content,
                    m.engagement_score,
                    m.posted_at,
                    json.dumps(m.raw_metadata),
                ),
            )
            ids.append(cursor.lastrowid)
        conn.commit()
    finally:
        cursor.close()
        conn.close()
    return ids


async def run_ingestion(keywords: list[str]) -> list[int]:
    adapters = [RedditAdapter()]
    if os.getenv("YOUTUBE_API_KEY"):
        adapters.append(YouTubeAdapter())
    if os.getenv("NEWS_API_KEY"):
        adapters.append(NewsAdapter())
    # Discovery runs before SpiderWeb — it seeds dynamic URLs into Spider
    if os.getenv("SERPAPI_KEY"):
        adapters.append(DiscoveryAdapter())
        
    # Local spider web scraper
    adapters.append(SpiderWebAdapter())

    all_mentions: list[Mention] = []
    tasks = [adapter.fetch(kw) for adapter in adapters for kw in keywords]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    for result in results:
        if isinstance(result, Exception):
            print(f"[ingestion] adapter error: {result}")
        else:
            all_mentions.extend(result)

    print(f"[ingestion] fetched {len(all_mentions)} mentions")
    ids = _save_mentions(all_mentions)
    print(f"[ingestion] saved {len(ids)} rows")
    return ids


def _load_keywords() -> list[str]:
    """Load keywords from DB; fall back to REDDIT_KEYWORDS env var if table empty."""
    try:
        conn = get_conn()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT keyword FROM tracked_keywords ORDER BY created_at")
            rows = cursor.fetchall()
            if rows:
                return [r[0] for r in rows]
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        print(f"[worker] DB keyword load failed: {e}")
    # Fallback
    raw = os.getenv("REDDIT_KEYWORDS", os.getenv("TRACKED_ENTITIES", "JECRC University"))
    return [k.strip() for k in raw.split(",") if k.strip()]


if __name__ == "__main__":
    keywords = _load_keywords()
    print(f"[worker] running ingestion for keywords: {keywords}")
    asyncio.run(run_ingestion(keywords))
