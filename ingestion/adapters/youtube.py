"""YouTube adapter — searches videos by keyword and pulls top comments."""
import os
import httpx
from datetime import datetime, timezone
from ingestion.adapters.base import BaseAdapter, Mention

_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
_COMMENTS_URL = "https://www.googleapis.com/youtube/v3/commentThreads"
_MAX_VIDEOS = 10
_MAX_COMMENTS = 20


class YouTubeAdapter(BaseAdapter):
    def __init__(self):
        self._api_key = os.getenv("YOUTUBE_API_KEY", "")

    async def fetch(self, keyword: str) -> list[Mention]:
        if not self._api_key:
            raise RuntimeError("YOUTUBE_API_KEY not set")
        mentions: list[Mention] = []
        async with httpx.AsyncClient(timeout=20) as client:
            # 1. Search for videos matching keyword
            r = await client.get(_SEARCH_URL, params={
                "part": "snippet", "q": keyword, "type": "video",
                "maxResults": _MAX_VIDEOS, "key": self._api_key,
            })
            r.raise_for_status()
            videos = r.json().get("items", [])

            for video in videos:
                vid_id = video["id"]["videoId"]
                snippet = video["snippet"]
                vid_url = f"https://www.youtube.com/watch?v={vid_id}"

                # 2. Pull top-level comments for each video
                cr = await client.get(_COMMENTS_URL, params={
                    "part": "snippet", "videoId": vid_id,
                    "maxResults": _MAX_COMMENTS, "order": "relevance",
                    "key": self._api_key,
                })
                if cr.status_code != 200:
                    continue
                for thread in cr.json().get("items", []):
                    c = thread["snippet"]["topLevelComment"]["snippet"]
                    published = datetime.fromisoformat(
                        c["publishedAt"].replace("Z", "+00:00")
                    )
                    mentions.append(Mention(
                        source_platform="youtube",
                        source_url=vid_url,
                        author_handle=c.get("authorDisplayName"),
                        text_content=c["textDisplay"],
                        engagement_score=c.get("likeCount", 0),
                        posted_at=published,
                        raw_metadata={
                            "video_id": vid_id,
                            "video_title": snippet.get("title"),
                            "channel": snippet.get("channelTitle"),
                        },
                    ))
        return mentions
