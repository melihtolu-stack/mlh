"""
QR Code Admin Endpoint
Secure endpoint for admins to get WhatsApp QR code
"""
from fastapi import APIRouter, HTTPException, Header
from services.whatsapp_service import get_whatsapp_service
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["Admin"])

# Admin token from environment (change this in production!)
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "change_this_secure_token")


@router.get("/whatsapp/qr")
async def get_whatsapp_qr(authorization: str = Header(None)):
    """
    Get WhatsApp QR code for authentication (Admin only)
    
    Requires: Authorization header with Bearer token
    """
    # Verify admin token
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing authorization header"
        )
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization format. Use: Bearer <token>"
        )
    
    token = authorization.replace("Bearer ", "")
    
    if token != ADMIN_TOKEN:
        logger.warning(f"Unauthorized QR access attempt")
        raise HTTPException(
            status_code=401,
            detail="Invalid admin token"
        )
    
    # Get QR code from WhatsApp service
    try:
        whatsapp_service = get_whatsapp_service()
        qr_code = await whatsapp_service.get_qr_code()
        
        if qr_code:
            return {
                "status": "pending",
                "qr": qr_code,
                "instructions": [
                    "1. Open WhatsApp on your phone",
                    "2. Go to Settings → Linked Devices",
                    "3. Tap 'Link a Device'",
                    "4. Scan this QR code"
                ]
            }
        else:
            # Check if already connected
            health = await whatsapp_service.check_health()
            if health.get('whatsapp_ready'):
                return {
                    "status": "connected",
                    "message": "WhatsApp is already connected"
                }
            else:
                return {
                    "status": "initializing",
                    "message": "QR code not yet available, please wait..."
                }
                
    except Exception as e:
        logger.error(f"Error getting WhatsApp QR code: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get QR code: {str(e)}"
        )


@router.get("/whatsapp/status")
async def get_whatsapp_status(authorization: str = Header(None)):
    """
    Get WhatsApp connection status (Admin only)
    """
    # Verify admin token (same as above)
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    token = authorization.replace("Bearer ", "")
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid admin token")
    
    try:
        whatsapp_service = get_whatsapp_service()
        health = await whatsapp_service.check_health()
        
        return {
            "connected": health.get('whatsapp_ready', False),
            "service_status": health.get('status'),
            "service_available": health.get('whatsapp_service') == 'connected'
        }
        
    except Exception as e:
        logger.error(f"Error getting WhatsApp status: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get status: {str(e)}"
        )
