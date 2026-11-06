"""Domain services: single-purpose business logic, independent of HTTP routers."""
from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from .models import Favorite, Listing, Notification, Review


def assert_owner(listing: Listing, user_id: int):
    if listing.seller_id != user_id:
        raise HTTPException(403, 'เฉพาะเจ้าของประกาศเท่านั้น')


def notify(db: Session, user_id: int, content: str, link: str = '/'):
    db.add(Notification(user_id=user_id, content=content, link=link))


def listing_detail(db: Session, item: Listing) -> dict:
    average = db.scalar(select(func.avg(Review.stars)).where(Review.seller_id == item.seller_id))
    return {
        'id': item.id, 'seller_id': item.seller_id, 'seller_name': item.seller.display_name,
        'seller_verified': item.seller.verified, 'seller_rating': round(float(average), 1) if average else None,
        'title': item.title, 'description': item.description, 'price': item.price,
        'category': item.category, 'condition': item.condition, 'condition_percent': item.condition_percent,
        'pickup_location': item.pickup_location, 'status': item.status, 'images': item.images or [],
        'created_at': item.created_at.isoformat() + 'Z',
    }


def price_drop_alert(db: Session, listing: Listing):
    user_ids = db.scalars(select(Favorite.user_id).where(Favorite.listing_id == listing.id)).all()
    for user_id in user_ids:
        notify(db, user_id, f'สินค้าที่บันทึกไว้ลดราคา: {listing.title}', f'/listings/{listing.id}')
