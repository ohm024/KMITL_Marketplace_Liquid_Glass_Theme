"""Repository abstraction: the domain layer need not know query details (DIP)."""
from typing import Protocol
from sqlalchemy import select
from sqlalchemy.orm import Session
from .models import Listing


class ListingRepository(Protocol):
    def find(self, listing_id: int, *, lock: bool = False) -> Listing | None:
        ...


class SQLAlchemyListingRepository:
    def __init__(self, session: Session):
        self.session = session

    def find(self, listing_id: int, *, lock: bool = False) -> Listing | None:
        query = select(Listing).where(Listing.id == listing_id)
        if lock:
            query = query.with_for_update()
        return self.session.scalar(query)
