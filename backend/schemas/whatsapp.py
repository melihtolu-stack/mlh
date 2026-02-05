"""
WhatsApp schemas for request/response validation
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from schemas.media import MediaAttachment


class WhatsAppContactInfo(BaseModel):
    """
    Contact information from WhatsApp
    """
    name: Optional[str] = None
    number: Optional[str] = None


class WhatsAppIncomingRequest(BaseModel):
    """
    Schema for incoming WhatsApp webhook from whatsapp-service
    """
    from_phone: str  # Phone number with @c.us suffix (e.g., "905551234567@c.us")
    from_name: Optional[str] = None
    content: str  # Message body/content
    message_id: str  # WhatsApp message ID
    timestamp: Optional[int] = None  # Unix timestamp
    channel: str = "whatsapp"
    
    # Additional fields from whatsapp-service webhook
    to: Optional[str] = None
    type: Optional[str] = "text"
    is_group: Optional[bool] = False
    contact: Optional[WhatsAppContactInfo] = None
    attachments: Optional[List[MediaAttachment]] = None

    class Config:
        # Allow extra fields from webhook
        extra = "ignore"


class WhatsAppIncomingResponse(BaseModel):
    """
    Schema for WhatsApp processing response
    """
    success: bool
    message_id: Optional[str] = None
    conversation_id: Optional[str] = None
    customer_id: Optional[str] = None
    detected_language: Optional[str] = None
    translated_content: Optional[str] = None
    error: Optional[str] = None


class WhatsAppSendRequest(BaseModel):
    """
    Schema for sending WhatsApp message
    """
    to: str  # Phone number (e.g., "905551234567" or "905551234567@c.us")
    message: str
    type: str = "text"


class WhatsAppSendResponse(BaseModel):
    """
    Schema for WhatsApp send response
    """
    success: bool
    message_id: Optional[str] = None
    timestamp: Optional[int] = None
    error: Optional[str] = None
