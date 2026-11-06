from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session
from ..database import get_db
from ..config import get_settings
from ..models import (ChatMessage, Listing, Notification, Report, Reservation,
                      Review, User)
from ..realtime import manager
from ..schemas import ChatInput, ReportInput, ReviewInput
from ..security import get_current_user, require_admin
from ..services import notify

router = APIRouter(tags=['Community'])


def validate_partner(db: Session, listing_id: int, uid: int, partner: int):
    item = db.get(Listing, listing_id)
    other = db.get(User, partner)
    if not item or item.status == 'removed' or not other or other.is_banned:
        raise HTTPException(404, 'ไม่พบคู่สนทนาหรือสินค้า')
    if uid == partner or (uid != item.seller_id and partner != item.seller_id):
        raise HTTPException(403, 'สนทนาได้เฉพาะผู้ซื้อและผู้ขาย')
    if uid == item.seller_id:
        initiated = db.scalar(select(ChatMessage.id).where(ChatMessage.listing_id == listing_id,
                            ChatMessage.sender_id == partner, ChatMessage.recipient_id == uid))
        reservation = db.scalar(select(Reservation.id).where(Reservation.listing_id == listing_id,
                                Reservation.buyer_id == partner))
        if not initiated and not reservation:
            raise HTTPException(403, 'ผู้ซื้อยังไม่เริ่มสนทนา')
    return item


@router.get('/chats')
def my_chats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    messages = db.scalars(select(ChatMessage).where(or_(ChatMessage.sender_id == user.id,
                     ChatMessage.recipient_id == user.id)).order_by(ChatMessage.id.desc()).limit(500)).all()
    seen = set()
    result = []
    for msg in messages:
        partner = msg.recipient_id if msg.sender_id == user.id else msg.sender_id
        key = (msg.listing_id, partner)
        if key in seen:
            continue
        seen.add(key)
        item = db.get(Listing, msg.listing_id)
        other = db.get(User, partner)
        if item and other:
            result.append({'listing_id': msg.listing_id, 'title': item.title,
                           'partner_id': partner, 'partner_name': other.display_name,
                           'last_message': msg.content[:100]})
    return result


@router.get('/listings/{listing_id}/messages')
def messages(listing_id: int, partner_id: int = Query(gt=0),
             user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    validate_partner(db, listing_id, user.id, partner_id)
    msgs = db.scalars(select(ChatMessage).where(ChatMessage.listing_id == listing_id,
        or_(and_(ChatMessage.sender_id == user.id, ChatMessage.recipient_id == partner_id),
            and_(ChatMessage.sender_id == partner_id, ChatMessage.recipient_id == user.id)))
        .order_by(ChatMessage.id.asc()).limit(200)).all()
    return [{'id': x.id, 'sender_id': x.sender_id, 'recipient_id': x.recipient_id,
             'content': x.content, 'kind': x.kind, 'created_at': x.created_at.isoformat() + 'Z'}
            for x in msgs]


@router.post('/listings/{listing_id}/messages', status_code=201)
async def send_message(listing_id: int, data: ChatInput, user: User = Depends(get_current_user),
                       db: Session = Depends(get_db)):
    item = validate_partner(db, listing_id, user.id, data.partner_id)
    if data.kind == 'image' and not data.content.startswith('https://'):
        raise HTTPException(400, 'รูปภาพต้องเป็น HTTPS URL')
    # For location, a text description of an in-campus meeting point is accepted.
    msg = ChatMessage(listing_id=listing_id, sender_id=user.id,
                      recipient_id=data.partner_id, content=data.content, kind=data.kind)
    db.add(msg)
    notify(db, data.partner_id, f'ข้อความใหม่เกี่ยวกับ {item.title}', f'/messages?listing={item.id}&partner={user.id}')
    db.commit()
    db.refresh(msg)
    await manager.emit(data.partner_id, {'type': 'new_message', 'listing_id': listing_id, 'sender_id': user.id})
    return {'id': msg.id, 'status': 'sent'}


@router.post('/reviews', status_code=201)
def review(data: ReviewInput, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.get(Reservation, data.reservation_id)
    if not booking or booking.buyer_id != user.id or booking.status != 'completed':
        raise HTTPException(403, 'รีวิวได้เฉพาะผู้ซื้อที่ปิดดีลแล้ว')
    if db.scalar(select(Review).where(Review.reservation_id == booking.id)):
        raise HTTPException(409, 'รีวิวรายการนี้แล้ว')
    item = db.get(Listing, booking.listing_id)
    db.add(Review(reservation_id=booking.id, seller_id=item.seller_id, buyer_id=user.id,
                  stars=data.stars, content=data.content))
    notify(db, item.seller_id, f'ได้รับรีวิวใหม่สำหรับ {item.title}', f'/listings/{item.id}')
    db.commit()
    return {'message': 'บันทึกรีวิวแล้ว'}


@router.get('/users/{user_id}/reviews')
def seller_reviews(user_id: int, db: Session = Depends(get_db)):
    reviews = db.scalars(select(Review).where(Review.seller_id == user_id)
                         .order_by(Review.id.desc()).limit(100)).all()
    return [{'stars': r.stars, 'content': r.content, 'buyer_id': r.buyer_id}
            for r in reviews]


@router.get('/notifications')
def notifications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.scalars(select(Notification).where(Notification.user_id == user.id)
                       .order_by(Notification.id.desc()).limit(100)).all()
    return [{'id': x.id, 'content': x.content, 'link': x.link,
             'read': x.read, 'created_at': x.created_at.isoformat() + 'Z'} for x in items]


@router.post('/notifications/{notification_id}/read')
def mark_read(notification_id: int, user: User = Depends(get_current_user),
              db: Session = Depends(get_db)):
    note = db.get(Notification, notification_id)
    if not note or note.user_id != user.id:
        raise HTTPException(404, 'ไม่พบการแจ้งเตือน')
    note.read = True
    db.commit()
    return {'message': 'read'}


@router.post('/reports', status_code=201)
def submit_report(data: ReportInput, user: User = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    if data.listing_id is not None and not db.get(Listing, data.listing_id):
        raise HTTPException(404, 'ไม่พบสินค้า')
    if data.user_id is not None and not db.get(User, data.user_id):
        raise HTTPException(404, 'ไม่พบผู้ใช้')
    report = Report(reporter_id=user.id, **data.model_dump())
    db.add(report)
    db.commit()
    return {'message': 'ส่งรายงานแล้ว'}


@router.get('/admin/reports')
def admin_reports(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    rows = db.scalars(select(Report).order_by(Report.id.desc()).limit(200)).all()
    return [{'id': r.id, 'reporter_id': r.reporter_id, 'listing_id': r.listing_id,
             'user_id': r.user_id, 'reason': r.reason, 'status': r.status} for r in rows]


@router.post('/admin/reports/{report_id}/resolve')
def resolve(report_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    report = db.get(Report, report_id)
    if not report:
        raise HTTPException(404, 'ไม่พบรายงาน')
    report.status = 'resolved'
    db.commit()
    return {'message': 'resolved'}


@router.post('/admin/listings/{listing_id}/remove')
def remove_listing(listing_id: int, admin: User = Depends(require_admin),
                   db: Session = Depends(get_db)):
    item = db.get(Listing, listing_id)
    if not item:
        raise HTTPException(404, 'ไม่พบสินค้า')
    item.status = 'removed'
    notify(db, item.seller_id, f'ประกาศถูกระงับโดยผู้ดูแล: {item.title}')
    db.commit()
    return {'message': 'removed'}


@router.post('/admin/users/{user_id}/ban')
def ban_user(user_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(404, 'ไม่พบผู้ใช้')
    if target.email in get_settings().admins:
        raise HTTPException(403, 'ไม่สามารถแบนผู้ดูแล')
    target.is_banned = True
    db.commit()
    return {'message': 'banned'}
