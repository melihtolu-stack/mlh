from pydantic import BaseModel
from typing import Optional, Dict, Any

class LeadCreate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    source: Optional[str] = "api"
    payload: Optional[Dict[str, Any]] = None


class LeadOut(LeadCreate):
    id: str
