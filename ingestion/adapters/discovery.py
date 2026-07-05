"""SerpAPI discovery adapter.

Flow per keyword:
  1. Build search queries from TRACKED_ENTITIES × query templates
  2. Call SerpAPI (Google engine) for each query, collect organic result URLs + snippets
  3. Deduplicate against source_urls already in the mentions table
  4. If SPIDER_API_KEY is set: scrape full content via spider_web.scrape_urls()
     Otherwise: fall back to the SerpAPI snippet as text_content
  5. Return Mention objects with source_platform = discovered domain
"""
import os
from urllib.parse import urlparse

import httpx
from dotenv import load_dotenv

from db.connection import get_conn
from ingestion.adapters.base import BaseAdapter, Mention

load_dotenv()

_SERP_URL = "https://serpapi.com/search"
_MAX_QUERIES = int(os.getenv("DISCOVERY_QUERIES_PER_RUN", "20"))

_QUERY_TEMPLATES = [
    '"{entity}" review OR complaint OR experience',
    '"{entity}" site:quora.com OR site:reddit.com OR site:trustpilot.com',
    '"{entity}" site:shiksha.com OR site:collegedunia.com OR site:g2.com',
    '"{entity}" site:linkedin.com/posts/ OR site:linkedin.com/in/',
    '"{entity}" site:instagram.com',
    '"{entity}" site:twitter.com OR site:x.com',
]


def _load_tracked_entities() -> list[str]:
    """Load from tracked_keywords DB table; fall back to TRACKED_ENTITIES env var."""
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
    except Exception:
        pass
    return [e.strip() for e in os.getenv("TRACKED_ENTITIES", "").split(",") if e.strip()]


def _build_queries(keyword: str) -> list[str]:
    entities = _load_tracked_entities() or [keyword]
    queries: list[str] = []
    for entity in entities:
        for tpl in _QUERY_TEMPLATES:
            queries.append(tpl.format(entity=entity))
            if len(queries) >= _MAX_QUERIES:
                return queries
    return queries


def _existing_urls() -> set[str]:
    """Return all source_urls already stored in the mentions table."""
    conn = get_conn()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT source_url FROM mentions WHERE source_url IS NOT NULL")
        return {row[0] for row in cursor.fetchall()}
    finally:
        cursor.close()
        conn.close()


def _domain(url: str) -> str:
    return urlparse(url).netloc.removeprefix("www.") or "web"


class DiscoveryAdapter(BaseAdapter):
    def __init__(self, dry_run: bool = False):
        self._serp_key = os.getenv("SERPAPI_KEY", "")
        self._spider_key = os.getenv("SPIDER_API_KEY", "")
        self.dry_run = dry_run

    async def fetch(self, keyword: str) -> list[Mention]:
        if not self._serp_key:
            raise RuntimeError("SERPAPI_KEY not set")

        queries = _build_queries(keyword)
        existing = _existing_urls()

        # --- Step 1: collect URLs + snippets from SerpAPI ---
        discovered: dict[str, str] = {}  # url -> snippet
        async with httpx.AsyncClient(timeout=20) as client:
            for query in queries:
                try:
                    r = await client.get(_SERP_URL, params={
                        "engine": "google",
                        "q": query,
                        "api_key": self._serp_key,
                        "num": 10,
                    })
                    r.raise_for_status()
                except Exception as e:
                    print(f"[discovery] SerpAPI error for '{query}': {e}")
                    continue

                for result in r.json().get("organic_results", []):
                    url = result.get("link")
                    snippet = result.get("snippet", "")
                    if url and url not in existing and url not in discovered:
                        discovered[url] = snippet

        print(f"[discovery] found {len(discovered)} new URLs for keyword='{keyword}'")

        if self.dry_run:
            for url, snippet in discovered.items():
                print(f"  [dry-run] {_domain(url)} — {url}")
                print(f"            {snippet[:120]}")
            return []

        if not discovered:
            return []

        # --- Step 2: scrape full content or fall back to snippet ---
        if self._spider_key:
            from ingestion.adapters.spider_web import scrape_urls
            platform_override = {url: _domain(url) for url in discovered}
            return await scrape_urls(
                list(discovered.keys()), keyword, self._spider_key, platform_override
            )

        # No Spider key — use SerpAPI snippets directly as text_content
        mentions = []
        for url, snippet in discovered.items():
            if not snippet.strip():
                continue
            mentions.append(Mention(
                source_platform=_domain(url),
                source_url=url,
                text_content=snippet,
                raw_metadata={"source": "serpapi_snippet"},
            ))
        return mentions
