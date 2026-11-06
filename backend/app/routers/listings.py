from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import or_, select
from sqlalchemy.orm import Session
from ..listing_service import ListingService
from ..repositories import SQLAlchemyListingRepository
from ..database import get_db
from ..image_storage import save_webp
from ..models import Favorite, Listing, Reservation, User
from ..schemas import ListingCreate, ListingPatch
from ..security import get_current_user
from ..services import assert_owner, listing_detail, notify, price_drop_alert

router = APIRouter(prefix='/listings', tags=['Listings'])


def get_listing(db, listing_id, lock=False):
    query = select(Listing).where(Listing.id == listing_id)
    if lock:
        query = query.with_for_update()
    item = db.scalar(query)
    if not item:
        raise HTTPException(404, 'ไม่พบสินค้า')
    return item


@router.get('')
def browse(q: str = '', category: str = '', condition: str = '', pickup_location: str = '',
           min_price: int = Query(default=0, ge=0), max_price: int | None = Query(default=None, ge=0),
           sort: str = 'newest', status: str = '', seller_id: int | None = None,
           limit: int = Query(default=24, ge=1, le=100), offset: int = Query(default=0, ge=0),
           db: Session = Depends(get_db)):
    stmt = select(Listing).join(User, Listing.seller_id == User.id).where(User.is_banned.is_(False), Listing.status != 'removed')
    if q.strip():
        term = f'%{q.strip()}%'
        stmt = stmt.where(or_(Listing.title.ilike(term), Listing.description.ilike(term)))
    if category:
        stmt = stmt.where(Listing.category == category)
    if condition:
        stmt = stmt.where(Listing.condition == condition)
    if pickup_location:
        stmt = stmt.where(Listing.pickup_location.ilike(f'%{pickup_location}%'))
    if min_price:
        stmt = stmt.where(Listing.price >= min_price)
    if max_price is not None:
        stmt = stmt.where(Listing.price <= max_price)
    if status:
        stmt = stmt.where(Listing.status == status)
    if seller_id is not None:
        stmt = stmt.where(Listing.seller_id == seller_id)
    if sort == 'price_asc':
        stmt = stmt.order_by(Listing.price.asc(), Listing.id.desc())
    elif sort == 'price_desc':
        stmt = stmt.order_by(Listing.price.desc(), Listing.id.desc())
    else:
        stmt = stmt.order_by(Listing.created_at.desc(), Listing.id.desc())
    return [listing_detail(db, item) for item in db.scalars(stmt.offset(offset).limit(limit)).all()]


@router.get('/{listing_id}')
def detail(listing_id: int, db: Session = Depends(get_db)):
    item = get_listing(db, listing_id)
    if item.seller.is_banned or item.status == 'removed':
        raise HTTPException(404, 'ไม่พบสินค้า')
    return listing_detail(db, item)


@router.post('', status_code=201)
def create(data: ListingCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = Listing(seller_id=user.id, **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return listing_detail(db, item)


@router.patch('/{listing_id}')
def update(listing_id: int, data: ListingPatch, user: User = Depends(get_current_user),
           db: Session = Depends(get_db)):
    service = ListingService(SQLAlchemyListingRepository(db))
    item = service.owner_listing(listing_id, user.id)
    service.check_editable(item)
    old_price = item.price
    for key, value in data.model_dump(exclude_unset=True, exclude_none=True).items():
        setattr(item, key, value)
    if item.price < old_price:
        price_drop_alert(db, item)
    db.commit()
    return listing_detail(db, item)


@router.delete('/{listing_id}')
def remove(listing_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = ListingService(SQLAlchemyListingRepository(db)).owner_listing(listing_id, user.id)
    # Soft delete preserves history and referential integrity.
    item.status = 'removed'
    db.commit()
    return {'message': 'ซ่อนประกาศแล้ว'}


@router.post('/{listing_id}/images')
async def upload_image(listing_id: int, file: UploadFile = File(...),
                       user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = get_listing(db, listing_id)
    assert_owner(item, user.id)
    if item.status in ('sold', 'removed'):
        raise HTTPException(409, 'ไม่สามารถเพิ่มรูปภาพให้ประกาศนี้')
    if len(item.images or []) >= 10:
        raise HTTPException(400, 'อัปโหลดได้สูงสุด 10 รูป')
    url = await save_webp(file)
    item.images = [*(item.images or []), url]
    db.commit()
    return {'url': url, 'images': item.images}


@router.post('/{listing_id}/favorite')
def toggle_favorite(listing_id: int, user: User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    get_listing(db, listing_id)
    existing = db.scalar(select(Favorite).where(Favorite.user_id == user.id,
                                                Favorite.listing_id == listing_id))
    if existing:
        db.delete(existing)
    else:
        db.add(Favorite(user_id=user.id, listing_id=listing_id))
    db.commit()
    return {'is_favorite': not bool(existing)}


@router.get('/me/favorites')
def favorites(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.scalars(select(Listing).join(Favorite, Favorite.listing_id == Listing.id)
                       .where(Favorite.user_id == user.id)).all()
    return [listing_detail(db, x) for x in items]


@router.post('/{listing_id}/reserve')
def reserve(listing_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = get_listing(db, listing_id, lock=True)
    if item.seller_id == user.id:
        raise HTTPException(400, 'จองสินค้าตัวเองไม่ได้')
    if item.status != 'available':
        raise HTTPException(409, 'สินค้านี้ไม่พร้อมจอง')
    item.status = 'reserved'
    booking = Reservation(listing_id=item.id, buyer_id=user.id)
    db.add(booking)
    notify(db, item.seller_id, f'มีการจองสินค้า: {item.title}', f'/listings/{item.id}')
    db.commit()
    db.refresh(booking)
    return {'reservation_id': booking.id, 'status': booking.status}


@router.post('/{listing_id}/complete')
def complete(listing_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = get_listing(db, listing_id, lock=True)
    assert_owner(item, user.id)
    booking = db.scalar(select(Reservation).where(Reservation.listing_id == listing_id,
                        Reservation.status == 'reserved').with_for_update())
    if item.status != 'reserved' or not booking:
        raise HTTPException(409, 'ไม่มีรายการจองที่รอยืนยัน')
    booking.status = 'completed'
    item.status = 'sold'
    notify(db, booking.buyer_id, f'ผู้ขายยืนยันซื้อขายเสร็จสิ้น: {item.title}', f'/listings/{item.id}')
    db.commit()
    return {'status': item.status, 'reservation_id': booking.id}


@router.post('/{listing_id}/cancel')
def cancel(listing_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = get_listing(db, listing_id, lock=True)
    booking = db.scalar(select(Reservation).where(Reservation.listing_id == listing_id,
                        Reservation.status == 'reserved').with_for_update())
    if item.status != 'reserved' or not booking:
        raise HTTPException(409, 'ไม่มีรายการจองที่ยกเลิกได้')
    if user.id not in (item.seller_id, booking.buyer_id):
        raise HTTPException(403, 'ไม่มีสิทธิ์ยกเลิก')
    booking.status = 'cancelled'
    item.status = 'available'
    notify(db, booking.buyer_id if user.id == item.seller_id else item.seller_id,
           f'การจองถูกยกเลิก: {item.title}', f'/listings/{item.id}')
    db.commit()
    return {'status': item.status}


@router.get('/{listing_id}/reservation')
def reservation_status(listing_id: int, user: User = Depends(get_current_user),
                       db: Session = Depends(get_db)):
    item = get_listing(db, listing_id)
    booking = db.scalar(select(Reservation).where(Reservation.listing_id == listing_id,
                        Reservation.status.in_(['reserved', 'completed']))
                       .order_by(Reservation.id.desc()))
    if not booking or user.id not in (item.seller_id, booking.buyer_id):
        return {'reservation': None}
    return {'reservation': {'id': booking.id, 'buyer_id': booking.buyer_id,
                            'status': booking.status}}
