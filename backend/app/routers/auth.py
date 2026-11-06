from datetime import timedelta
import hmac
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..config import get_settings
from ..database import get_db
from ..models import OTPChallenge, User, utcnow
from ..schemas import EmailInput, OTPVerify
from ..security import create_session, new_otp, otp_digest, send_otp

router = APIRouter(prefix='/auth', tags=['Authentication'])


@router.post('/request-otp')
def request_otp(data: EmailInput, db: Session = Depends(get_db)):
    email = data.email
    now = utcnow()
    existing = db.scalar(select(OTPChallenge).where(OTPChallenge.email == email))
    account = db.scalar(select(User).where(User.email == email))
    if account and account.last_otp_sent and (now - account.last_otp_sent).total_seconds() < 60:
        raise HTTPException(429, 'ขอ OTP ซ้ำได้หลัง 60 วินาที')
    if existing and (now - existing.sent_at).total_seconds() < 60:
        raise HTTPException(429, 'ขอ OTP ซ้ำได้หลัง 60 วินาที')
    code = new_otp()
    # Do not save challenge until email sending succeeds.
    try:
        send_otp(email, code)
    except (OSError, RuntimeError) as exc:
        raise HTTPException(503, 'ระบบส่งอีเมลไม่พร้อมใช้งาน') from exc
    if existing:
        existing.code_hash = otp_digest(email, code)
        existing.sent_at = now
        existing.expires_at = now + timedelta(minutes=5)
        existing.attempts = 0
    else:
        db.add(OTPChallenge(email=email, code_hash=otp_digest(email, code),
                            sent_at=now, expires_at=now + timedelta(minutes=5)))
    if account:
        account.last_otp_sent = now
    db.commit()
    result = {'message': 'ส่ง OTP แล้ว (มีอายุ 5 นาที)'}
    # Deliberate local-only demo convenience. Never enabled with ENV=production.
    if not get_settings().is_production and not get_settings().smtp_host:
        result['dev_otp'] = code
    return result


@router.post('/verify-otp')
def verify_otp(data: OTPVerify, response: Response, db: Session = Depends(get_db)):
    now = utcnow()
    challenge = db.scalar(select(OTPChallenge).where(OTPChallenge.email == data.email).with_for_update())
    if not challenge or challenge.expires_at < now or challenge.attempts >= 5:
        raise HTTPException(400, 'OTP หมดอายุหรือไม่ถูกต้อง')
    challenge.attempts += 1
    if not hmac.compare_digest(challenge.code_hash, otp_digest(data.email, data.otp)):
        db.commit()
        raise HTTPException(400, 'OTP หมดอายุหรือไม่ถูกต้อง')
    db.delete(challenge)
    user = db.scalar(select(User).where(User.email == data.email))
    if user and user.is_banned:
        db.commit()
        raise HTTPException(403, 'บัญชีถูกระงับ')
    if not user:
        user = User(email=data.email, display_name=data.email.split('@')[0],
                    verified=True, is_admin=data.email in get_settings().admins,
                    last_otp_sent=challenge.sent_at)
        db.add(user)
        db.flush()
    db.commit()
    response.set_cookie('kmitl_session', create_session(user.id), max_age=12 * 3600,
                        httponly=True, secure=get_settings().is_production,
                        samesite='none' if get_settings().is_production else 'lax', path='/')
    return {'message': 'เข้าสู่ระบบสำเร็จ', 'user_id': user.id}


@router.post('/logout')
def logout(response: Response):
    response.delete_cookie('kmitl_session', path='/',
                           secure=get_settings().is_production,
                           samesite='none' if get_settings().is_production else 'lax')
    return {'message': 'ออกจากระบบแล้ว'}
