"""
Email schemas for request/response validation
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any, List
from schemas.media import MediaAttachment

class EmailIncomingRequest(BaseModel):
    """
    Schema for incoming email webhook
    """
    from_email: EmailStr
    from_name: Optional[str] = None
    subject: str
    body: str
    html_body: Optional[str] = None
    headers: Optional[Dict[str, Any]] = None
    attachments: Optional[List[MediaAttachment]] = None

class EmailIncomingResponse(BaseModel):
    """
    Schema for email processing response
    """
    success: bool
    message_id: Optional[str] = None
    conversation_id: Optional[str] = None
    customer_id: Optional[str] = None
    detected_language: Optional[str] = None
    translated_content: Optional[str] = None
    error: Optional[str] = None
