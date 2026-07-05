"""Web/review adapter using standard requests."""
import os
import requests
from urllib.parse import urlparse
from bs4 import BeautifulSoup
from ingestion.adapters.base import BaseAdapter, Mention

async def scrape_urls(
    urls: list[str],
    keyword: str,
    platform_override: dict[str, str] | None = None,
) -> list[Mention]:
    """Scrape a list of URLs using requests and BeautifulSoup."""
    mentions: list[Mention] = []
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    }

    for url in urls:
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code != 200:
                continue
                
            soup = BeautifulSoup(response.text, "html.parser")
            content = soup.get_text(separator=" ", strip=True)
            
            if not content or keyword.lower() not in content.lower():
                continue
                
            platform = (
                (platform_override or {}).get(url)
                or urlparse(url).netloc.removeprefix("www.")
                or "web"
            )
            mentions.append(Mention(
                source_platform=platform,
                source_url=url,
                text_content=content[:5000], # Limit length
                raw_metadata={"method": "requests"},
            ))
        except Exception as e:
            print(f"[web_scraper] Error scraping {url}: {e}")
            continue
            
    return mentions


class SpiderWebAdapter(BaseAdapter):
    def __init__(self, urls: list[str] | None = None):
        self.urls = urls or [u.strip() for u in os.getenv("SPIDER_URLS", "").split(",") if u.strip()]

    async def fetch(self, keyword: str) -> list[Mention]:
        if not self.urls:
            return []
        return await scrape_urls(self.urls, keyword)
