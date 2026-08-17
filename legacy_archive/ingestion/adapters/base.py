"""Base interface every data-source adapter must implement."""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class Mention:
    source_platform: str
    text_content: str
    source_url: str | None = None
    author_handle: str | None = None
    engagement_score: int = 0
    posted_at: datetime | None = None
    raw_metadata: dict[str, Any] = field(default_factory=dict)


class BaseAdapter(ABC):
    @abstractmethod
    async def fetch(self, keyword: str) -> list[Mention]:
        """Fetch mentions for *keyword* and return normalised Mention objects."""
