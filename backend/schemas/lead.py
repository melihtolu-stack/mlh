from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, Any


class LeadCreate(BaseModel):
    name: str
    email: EmailStr
    message: str
    phone: Optional[str] = None

    @field_validator("name", "message")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Bu alan boş olamaz.")
        return v.strip()

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return (v or "").strip().lower()


class LeadCreateResponse(BaseModel):
    success: bool = True
    message: str
    id: str
    created_at: Any = None


class LeadOut(BaseModel):
    id: str
    name: str
    email: str
    message: str
    phone: Optional[str] = None
    source: str
    created_at: Optional[str] = None
