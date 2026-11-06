from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(Base):
    __tablename__ = 'users'
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(120), default='KMITL Member')
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    line_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    faculty: Mapped[str | None] = mapped_column(String(120), nullable=True)
    pickup_zone: Mapped[str | None] = mapped_column(String(160), nullable=True)
    verified: Mapped[bool] = mapped_column(Boolean, default=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    is_banned: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    last_otp_sent: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class OTPChallenge(Base):
    __tablename__ = 'otp_challenges'
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    code_hash: Mapped[str] = mapped_column(String(64))
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    sent_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime)


class Listing(Base):
    __tablename__ = 'listings'
    id: Mapped[int] = mapped_column(primary_key=True)
    seller_id: Mapped[int] = mapped_column(ForeignKey('users.id'), index=True)
    title: Mapped[str] = mapped_column(String(150))
    description: Mapped[str] = mapped_column(Text)
    price: Mapped[int] = mapped_column(Integer)
    category: Mapped[str] = mapped_column(String(80), index=True)
    condition: Mapped[str] = mapped_column(String(15))
    condition_percent: Mapped[int] = mapped_column(Integer, default=100)
    pickup_location: Mapped[str] = mapped_column(String(150))
    status: Mapped[str] = mapped_column(String(20), default='available', index=True)
    images: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    seller: Mapped['User'] = relationship()


class Reservation(Base):
    __tablename__ = 'reservations'
    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey('listings.id'), index=True)
    buyer_id: Mapped[int] = mapped_column(ForeignKey('users.id'), index=True)
    status: Mapped[str] = mapped_column(String(20), default='reserved')
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class ChatMessage(Base):
    __tablename__ = 'chat_messages'
    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey('listings.id'), index=True)
    sender_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    recipient_id: Mapped[int] = mapped_column(ForeignKey('users.id'), index=True)
    content: Mapped[str] = mapped_column(Text)
    kind: Mapped[str] = mapped_column(String(15), default='text')
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Review(Base):
    __tablename__ = 'reviews'
    __table_args__ = (UniqueConstraint('reservation_id', name='uq_review_reservation'),)
    id: Mapped[int] = mapped_column(primary_key=True)
    reservation_id: Mapped[int] = mapped_column(ForeignKey('reservations.id'))
    seller_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    buyer_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    stars: Mapped[int] = mapped_column(Integer)
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Favorite(Base):
    __tablename__ = 'favorites'
    __table_args__ = (UniqueConstraint('user_id', 'listing_id', name='uq_favorite'),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), index=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey('listings.id'))


class Notification(Base):
    __tablename__ = 'notifications'
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), index=True)
    content: Mapped[str] = mapped_column(String(300))
    link: Mapped[str] = mapped_column(String(300), default='/')
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Report(Base):
    __tablename__ = 'reports'
    id: Mapped[int] = mapped_column(primary_key=True)
    reporter_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    listing_id: Mapped[int | None] = mapped_column(ForeignKey('listings.id'), nullable=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey('users.id'), nullable=True)
    reason: Mapped[str] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(20), default='open')
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
