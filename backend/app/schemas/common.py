from __future__ import annotations

from pydantic import BaseModel, Field


class PaginationQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=10, ge=1, le=100)
    search: str | None = None
