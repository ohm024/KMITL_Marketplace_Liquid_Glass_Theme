"""Business-layer service; depends on ListingRepository Protocol, not an ORM implementation."""
from fastapi import HTTPException
from .models import Listing
from .repositories import ListingRepository


class ListingService:
    def __init__(self, repository: ListingRepository):
        self.repository = repository

    def get(self, listing_id: int, *, lock: bool = False) -> Listing:
        listing = self.repository.find(listing_id, lock=lock)
        if not listing:
            raise HTTPException(404, 'ไม่พบสินค้า')
        return listing

    def owner_listing(self, listing_id: int, user_id: int) -> Listing:
        listing = self.get(listing_id, lock=True)
        if listing.seller_id != user_id:
            raise HTTPException(403, 'เฉพาะเจ้าของประกาศเท่านั้น')
        return listing

    def check_editable(self, listing: Listing):
        if listing.status in ('sold', 'removed'):
            raise HTTPException(409, 'ไม่สามารถแก้ไขสินค้าที่ขายแล้วหรือถูกระงับ')
