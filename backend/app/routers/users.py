from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from ..database import get_db
from ..image_storage import save_webp
from ..config import get_settings
from ..models import Review, User
from ..schemas import ProfileUpdate
from ..security import get_current_user

router = APIRouter(prefix='/users', tags=['Users'])


def profile(db, user, private=False):
    score = db.scalar(select(func.avg(Review.stars)).where(Review.seller_id == user.id))
    data = {'id': user.id, 'display_name': user.display_name, 'avatar_url': user.avatar_url,
            'faculty': user.faculty, 'pickup_zone': user.pickup_zone, 'verified': user.verified,
            'seller_rating': round(float(score), 1) if score else None}
    if private:
        data.update(email=user.email, phone=user.phone, line_id=user.line_id,
                    is_admin=user.email in get_settings().admins)
    return data


@router.get('/me')
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return profile(db, user, private=True)


@router.patch('/me')
def update_me(data: ProfileUpdate, user: User = Depends(get_current_user),
              db: Session = Depends(get_db)):
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    db.commit()
    return profile(db, user, private=True)


@router.post('/me/avatar')
async def update_avatar(file: UploadFile = File(...), user: User = Depends(get_current_user),
                        db: Session = Depends(get_db)):
    user.avatar_url = await save_webp(file)
    db.commit()
    return {'avatar_url': user.avatar_url}


@router.get('/{user_id}')
def public_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user or user.is_banned:
        raise HTTPException(404, 'ไม่พบผู้ใช้')
    return profile(db, user)
