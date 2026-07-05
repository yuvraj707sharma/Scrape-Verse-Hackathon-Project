"""NewsAPI adapter — fetches news articles mentioning the keyword."""
import os
import httpx
from datetime import datetime, timezone
from ingestion.adapters.base import BaseAdapter, Mention

_URL = "https://newsapi.org/v2/everything"
_PAGE_SIZE = 20


class NewsAdapter(BaseAdapter):
    def __init__(self):
        self._api_key = os.getenv("NEWS_API_KEY", "")

    async def fetch(self, keyword: str) -> list[Mention]:
        if not self._api_key:
            raise RuntimeError("NEWS_API_KEY not set")
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.get(_URL, params={
                "q": keyword, "language": "en", "sortBy": "publishedAt",
                "pageSize": _PAGE_SIZE, "apiKey": self._api_key,
            })
            r.raise_for_status()
            articles = r.json().get("articles", [])

        mentions = []
        for a in articles:
            text = " ".join(filter(None, [a.get("title"), a.get("description"), a.get("content")]))
            if not text.strip():
                continue
            published = None
            if a.get("publishedAt"):
                published = datetime.fromisoformat(a["publishedAt"].replace("Z", "+00:00"))
            mentions.append(Mention(
                source_platform="news",
                source_url=a.get("url"),
                author_handle=a.get("author"),
                text_content=text,
                posted_at=published,
                raw_metadata={
                    "source": a.get("source", {}).get("name"),
                    "url_to_image": a.get("urlToImage"),
                },
            ))
        return mentions
