"""Repository layer placeholders — concrete queries land with Phase 2–4 data."""

from sqlalchemy.ext.asyncio import AsyncSession


class BaseRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
