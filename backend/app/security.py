import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
import smtplib
import jwt
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from .config import get_settings
from .database import get_db
from .models import User


def new_otp() -> str:
    return f'{secrets.randbelow(1_000_000):06d}'


def otp_digest(email: str, code: str) -> str:
    key = get_settings().secret_key.encode()
    return hmac.new(key, f'{email}:{code}'.encode(), hashlib.sha256).hexdigest()


def send_otp(email: str, code: str) -> None:
    settings = get_settings()
    if not settings.smtp_host:
        if settings.is_production:
            raise RuntimeError('SMTP must be configured in production')
        return
    msg = EmailMessage()
    msg['Subject'] = 'รหัส OTP สำหรับ KMITL Marketplace'
    msg['From'] = settings.smtp_from or settings.smtp_username
    msg['To'] = email
    msg.set_content(f'รหัส OTP ของคุณคือ {code}\nรหัสมีอายุ 5 นาที อย่าแชร์รหัสนี้กับผู้อื่น')
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
        smtp.starttls()
        smtp.login(settings.smtp_username, settings.smtp_password)
        smtp.send_message(msg)


def create_session(user_id: int) -> str:
    expiry = datetime.now(timezone.utc) + timedelta(hours=12)
    return jwt.encode({'sub': str(user_id), 'exp': expiry}, get_settings().secret_key, algorithm='HS256')


def decode_session(token: str) -> int | None:
    try:
        return int(jwt.decode(token, get_settings().secret_key, algorithms=['HS256'])['sub'])
    except (jwt.PyJWTError, ValueError, KeyError, TypeError):
        return None


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get('kmitl_session')
    uid = decode_session(token) if token else None
    user = db.get(User, uid) if uid is not None else None
    if not user or user.is_banned:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='กรุณาเข้าสู่ระบบ')
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.email not in get_settings().admins:
        raise HTTPException(status_code=403, detail='Admin only')
    return user
