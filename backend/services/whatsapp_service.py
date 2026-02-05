"""
WhatsApp Service
Handles communication with whatsapp-service for sending messages
"""
import os
import httpx
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

# WhatsApp service URL (Docker internal or external)
WHATSAPP_SERVICE_URL = os.getenv("WHATSAPP_SERVICE_URL", "http://whatsapp-service:3001")


class WhatsAppService:
    """
    Service for communicating with whatsapp-service
    """
    
    def __init__(self, base_url: str = None):
        self.base_url = base_url or WHATSAPP_SERVICE_URL
        self.timeout = 30.0  # seconds
    
    async def send_message(self, to: str, message: str, message_type: str = "text", media: Optional[list] = None) -> Dict[str, Any]:
        """
        Send a WhatsApp message
        
        Args:
            to: Phone number (e.g., "905551234567" or with @c.us suffix)
            message: Message content
            message_type: Message type (default: "text")
            
        Returns:
            Response dict with success, messageId, timestamp, or error
        """
        try:
            # Clean phone number (remove any non-numeric chars except +)
            clean_number = ''.join(c for c in to if c.isdigit() or c == '+')
            if clean_number.startswith('+'):
                clean_number = clean_number[1:]
            
            payload = {
                "to": clean_number,
                "message": message,
                "type": message_type,
                "media": media or []
            }
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/send",
                    json=payload
                )
                
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"WhatsApp message sent to {clean_number}")
                    return data
                else:
                    error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                    error_msg = error_data.get('error', f"HTTP {response.status_code}")
                    logger.error(f"Failed to send WhatsApp message: {error_msg}")
                    return {
                        "success": False,
                        "error": error_msg
                    }
                    
        except httpx.TimeoutException:
            logger.error(f"Timeout sending WhatsApp message to {to}")
            return {
                "success": False,
                "error": "Request timeout"
            }
        except httpx.ConnectError:
            logger.error(f"Cannot connect to WhatsApp service at {self.base_url}")
            return {
                "success": False,
                "error": "WhatsApp service unavailable"
            }
        except Exception as e:
            logger.error(f"Error sending WhatsApp message: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e)
            }
    
    async def check_health(self) -> Dict[str, Any]:
        """
        Check WhatsApp service health
        
        Returns:
            Health status dict
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.base_url}/health")
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "status": "ok",
                        "whatsapp_service": "connected",
                        "whatsapp_ready": data.get('whatsapp', {}).get('ready', False),
                        "has_qr": data.get('whatsapp', {}).get('hasQR', False)
                    }
                else:
                    return {
                        "status": "error",
                        "whatsapp_service": "unhealthy",
                        "http_status": response.status_code
                    }
                    
        except httpx.ConnectError:
            return {
                "status": "error",
                "whatsapp_service": "unavailable",
                "error": "Cannot connect to WhatsApp service"
            }
        except Exception as e:
            return {
                "status": "error",
                "whatsapp_service": "error",
                "error": str(e)
            }
    
    async def get_qr_code(self) -> Optional[str]:
        """
        Get QR code for WhatsApp authentication
        
        Returns:
            QR code string or None if not available
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.base_url}/qr")
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('status') == 'pending':
                        return data.get('qr')
                return None
                
        except Exception as e:
            logger.error(f"Error getting WhatsApp QR code: {e}")
            return None
    
    def is_configured(self) -> bool:
        """
        Check if WhatsApp service URL is configured
        """
        return bool(self.base_url)


# Singleton instance
_whatsapp_service: Optional[WhatsAppService] = None


def get_whatsapp_service() -> WhatsAppService:
    """Get singleton instance of WhatsAppService"""
    global _whatsapp_service
    if _whatsapp_service is None:
        _whatsapp_service = WhatsAppService()
    return _whatsapp_service
