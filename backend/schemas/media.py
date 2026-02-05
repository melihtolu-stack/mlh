"""
Shared media attachment schema
"""
from pydantic import BaseModel
from typing import Optional


class MediaAttachment(BaseModel):
    """
    Media attachment for messages
    """
    url: Optional[str] = None
    data: Optional[str] = None  # base64 data (optional)
    name: Optional[str] = None
    type: Optional[str] = None
    size: Optional[int] = None
