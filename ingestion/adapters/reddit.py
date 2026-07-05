"""Reddit adapter — uses PRAW (synchronous) wrapped in asyncio.to_thread."""
import asyncio
import os
from datetime import datetime, timezone

import praw
from dotenv import load_dotenv

from ingestion.adapters.base import BaseAdapter, Mention

load_dotenv()

_SUBREDDITS = os.getenv("REDDIT_SUBREDDITS", "all")
_LIMIT = 25  # posts per keyword search


def _build_reddit() -> praw.Reddit:
    return praw.Reddit(
        client_id=os.getenv("REDDIT_CLIENT_ID"),
        client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
        user_agent=os.getenv("REDDIT_USER_AGENT", "social-listener/0.1"),
    )


def _fetch_sync(keyword: str) -> list[Mention]:
    reddit = _build_reddit()
    mentions: list[Mention] = []

    for sub_name in _SUBREDDITS.split(","):
        sub = reddit.subreddit(sub_name.strip())
        for post in sub.search(keyword, limit=_LIMIT, sort="new"):
            posted = datetime.fromtimestamp(post.created_utc, tz=timezone.utc)

            # Post itself
            mentions.append(
                Mention(
                    source_platform="reddit",
                    source_url=f"https://reddit.com{post.permalink}",
                    author_handle=str(post.author) if post.author else None,
                    text_content=f"{post.title}\n\n{post.selftext}".strip(),
                    engagement_score=post.score,
                    posted_at=posted,
                    raw_metadata={
                        "post_id": post.id,
                        "subreddit": sub_name,
                        "num_comments": post.num_comments,
                        "upvote_ratio": post.upvote_ratio,
                    },
                )
            )

            # Top-level comments
            post.comments.replace_more(limit=0)
            for comment in post.comments[:10]:
                mentions.append(
                    Mention(
                        source_platform="reddit",
                        source_url=f"https://reddit.com{post.permalink}",
                        author_handle=str(comment.author) if comment.author else None,
                        text_content=comment.body,
                        engagement_score=comment.score,
                        posted_at=datetime.fromtimestamp(
                            comment.created_utc, tz=timezone.utc
                        ),
                        raw_metadata={
                            "comment_id": comment.id,
                            "post_id": post.id,
                            "subreddit": sub_name,
                        },
                    )
                )

    return mentions


class RedditAdapter(BaseAdapter):
    async def fetch(self, keyword: str) -> list[Mention]:
        return await asyncio.to_thread(_fetch_sync, keyword)
