from fastapi import APIRouter
from services.email_service import get_email_service
import os

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "ok"}

@router.get("/health/email-config")
def check_email_config():
    """Check email service configuration"""
    email_service = get_email_service()
    is_configured = email_service.is_configured()
    
    return {
        "configured": is_configured,
        "smtp_server": os.getenv("SMTP_SERVER"),
        "smtp_port": os.getenv("SMTP_PORT"),
        "smtp_username": os.getenv("SMTP_USERNAME"),
        "from_email": os.getenv("FROM_EMAIL"),
        "from_name": os.getenv("FROM_NAME"),
        "has_password": bool(os.getenv("SMTP_PASSWORD"))
    }

@router.post("/health/test-email")
def test_email_send():
    """Test email sending functionality"""
    from pydantic import BaseModel, EmailStr
    
    class TestEmailRequest(BaseModel):
        to_email: EmailStr
    
    email_service = get_email_service()
    
    if not email_service.is_configured():
        return {
            "success": False,
            "error": "Email service is not configured"
        }
    
    # This endpoint should be called with a test email
    # For now, just return configuration status
    return {
        "success": True,
        "message": "Email service is configured. Use /api/messages/send to test actual sending.",
        "config": {
            "smtp_server": os.getenv("SMTP_SERVER"),
            "smtp_port": os.getenv("SMTP_PORT"),
            "from_email": os.getenv("FROM_EMAIL")
        }
    }
