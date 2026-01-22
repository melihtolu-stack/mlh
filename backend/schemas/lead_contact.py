from pydantic import BaseModel, EmailStr
from typing import Optional

class LeadContactCreate(BaseModel):
    lead_id: str
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    source: Optional[str] = None
    payload: Optional[dict] = None
