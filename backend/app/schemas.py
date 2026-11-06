import re
from pydantic import BaseModel, Field, field_validator, model_validator


class EmailInput(BaseModel):
    email: str

    @field_validator('email')
    @classmethod
    def kmitl_email(cls, v: str) -> str:
        v = v.strip().lower()
        if len(v) > 255 or not re.fullmatch(r'[a-z0-9._%+\-]+@kmitl\.ac\.th', v):
            raise ValueError('ต้องใช้อีเมล @kmitl.ac.th')
        return v


class OTPVerify(EmailInput):
    otp: str = Field(pattern=r'^\d{6}$')


class ProfileUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=2, max_length=120)
    phone: str | None = Field(default=None, max_length=30)
    line_id: str | None = Field(default=None, max_length=100)
    faculty: str | None = Field(default=None, max_length=120)
    pickup_zone: str | None = Field(default=None, max_length=160)


class ListingCreate(BaseModel):
    title: str = Field(min_length=3, max_length=150)
    description: str = Field(min_length=5, max_length=5000)
    price: int = Field(ge=1, le=10_000_000)
    category: str = Field(min_length=2, max_length=80)
    condition: str
    condition_percent: int = Field(default=100, ge=1, le=100)
    pickup_location: str = Field(min_length=2, max_length=150)

    @field_validator('condition')
    @classmethod
    def check_condition(cls, v):
        if v not in ('new', 'used'):
            raise ValueError('condition must be new or used')
        return v


class ListingPatch(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=150)
    description: str | None = Field(default=None, min_length=5, max_length=5000)
    price: int | None = Field(default=None, ge=1, le=10_000_000)
    category: str | None = Field(default=None, min_length=2, max_length=80)
    condition: str | None = None
    condition_percent: int | None = Field(default=None, ge=1, le=100)
    pickup_location: str | None = Field(default=None, min_length=2, max_length=150)

    @field_validator('condition')
    @classmethod
    def check_condition(cls, v):
        if v is not None and v not in ('new', 'used'):
            raise ValueError('condition must be new or used')
        return v


class ChatInput(BaseModel):
    partner_id: int = Field(gt=0)
    content: str = Field(min_length=1, max_length=2000)
    kind: str = 'text'

    @field_validator('kind')
    @classmethod
    def check_kind(cls, v):
        if v not in ('text', 'image', 'location'):
            raise ValueError('Unsupported message kind')
        return v


class ReviewInput(BaseModel):
    reservation_id: int
    stars: int = Field(ge=1, le=5)
    content: str = Field(min_length=3, max_length=1000)


class ReportInput(BaseModel):
    listing_id: int | None = None
    user_id: int | None = None
    reason: str = Field(min_length=10, max_length=500)

    @model_validator(mode='after')
    def require_target(self):
        if (self.listing_id is None) == (self.user_id is None):
            raise ValueError('เลือกเป้าหมายรายงานเพียงหนึ่งอย่าง')
        return self
