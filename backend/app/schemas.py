from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime
from enum import Enum
from uuid import UUID

# Product Schemas
class ProductBase(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=200)
    price: float = Field(..., gt=0)
    quantity: int = Field(default=0, ge=0)

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Inventory Schemas
class InventoryRecordBase(BaseModel):
    product_id: int
    quantity_change: int
    notes: Optional[str] = None

class InventoryRecordCreate(InventoryRecordBase):
    pass

class InventoryRecord(InventoryRecordBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Invoice Schemas
class InvoiceItemBase(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)

class InvoiceItemCreate(InvoiceItemBase):
    pass

class InvoiceItem(InvoiceItemBase):
    id: int
    invoice_id: int
    total_price: float

    class Config:
        from_attributes = True

class InvoiceBase(BaseModel):
    items: List[InvoiceItemCreate]

class InvoiceCreate(InvoiceBase):
    pass

class Invoice(BaseModel):
    id: int
    invoice_number: str
    total_amount: float
    created_at: datetime
    items: List[InvoiceItem]

    class Config:
        from_attributes = True

# Auth Schemas
class EmailRequest(BaseModel):
    email: EmailStr
    turnstile_token: str = Field(..., description="Cloudflare Turnstile token")

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6, pattern="^[0-9]{6}$")

class AuthResponse(BaseModel):
    message: str
    user_id: Optional[UUID] = None

class OTPStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    EXPIRED = "expired"
    INVALID = "invalid"

class OTPResponse(BaseModel):
    status: OTPStatus
    message: str

# User Schemas
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: UUID
    created_at: datetime
    last_login: Optional[datetime]

    class Config:
        from_attributes = True

# Search Schemas
class ProductSearch(BaseModel):
    query: str = Field(..., min_length=1)
    page: int = Field(default=1, gt=0)
    limit: int = Field(default=10, gt=0, le=100)

# Response Schemas
class ProductResponse(BaseModel):
    total: int
    items: List[Product]

class InventoryResponse(BaseModel):
    total: int
    items: List[InventoryRecord]

class InvoiceResponse(BaseModel):
    total: int
    items: List[Invoice]

class UserProfile(BaseModel):
    id: UUID
    email: EmailStr
    username: str
    avatar_url: str
    created_at: datetime
    last_login: datetime

class UserProfileUpdate(BaseModel):
    username: str

class AvatarResponse(BaseModel):
    """Schema for avatar presigned URL response."""
    upload_url: str
    download_url: Optional[str] = None

class AvatarConfirm(BaseModel):
    """Schema for confirming avatar upload."""
    object_key: str

    class Config:
        from_attributes = True