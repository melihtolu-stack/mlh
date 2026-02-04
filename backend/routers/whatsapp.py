"""
WhatsApp Router
Handles incoming WhatsApp webhooks and WhatsApp-related endpoints
"""
from fastapi import APIRouter, HTTPException
from schemas.whatsapp import WhatsAppIncomingRequest, WhatsAppIncomingResponse
from services.language_detection import get_language_detection_service
from services.translation_service import get_translation_service
from services.message_service import get_message_service
from services.whatsapp_service import get_whatsapp_service
from services.supabase_client import supabase
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/whatsapp", tags=["WhatsApp"])


def extract_phone_number(phone_with_suffix: str) -> str:
    """
    Extract clean phone number from WhatsApp format
    e.g., "905551234567@c.us" -> "905551234567"
    """
    if "@" in phone_with_suffix:
        return phone_with_suffix.split("@")[0]
    return phone_with_suffix


def is_valid_phone_number(phone: str) -> bool:
    """
    Validate if phone number is a real phone number (not an ID)
    Real phone numbers: 10-15 digits, starts with country code
    Invalid: Very long (>15 chars) or contains letters
    """
    # Remove common prefixes
    clean_phone = phone.replace('+', '').strip()
    
    # Check if it's all digits
    if not clean_phone.isdigit():
        return False
    
    # Check length (valid phone: 10-15 digits)
    if len(clean_phone) < 10 or len(clean_phone) > 15:
        return False
    
    return True


@router.post("/incoming", response_model=WhatsAppIncomingResponse)
async def handle_incoming_whatsapp(request: WhatsAppIncomingRequest):
    """
    Handle incoming WhatsApp message webhook
    Processes message, detects language, translates to Turkish,
    and creates conversation/message in CRM
    """
    try:
        # Initialize services
        language_detector = get_language_detection_service()
        translator = get_translation_service()
        message_service = get_message_service()
        
        # Extract phone number and customer info
        phone_number = extract_phone_number(request.from_phone)
        
        # Validate phone number (skip if it's an ID, not a real phone)
        if not is_valid_phone_number(phone_number):
            logger.warning(f"Invalid phone number (likely an ID): {phone_number} - Skipping message")
            return WhatsAppIncomingResponse(
                success=True,
                message_id=request.message_id,
                error=f"Invalid phone number format: {phone_number}"
            )
        
        customer_name = request.from_name
        
        # Try to get name from contact info if not in from_name
        if not customer_name and request.contact:
            customer_name = request.contact.name
        
        if not customer_name:
            customer_name = f"WhatsApp {phone_number}"
        
        message_content = request.content
        
        if not message_content:
            raise HTTPException(
                status_code=400,
                detail="No message content found in WhatsApp message"
            )
        
        # Skip group messages (optional - can be changed based on requirements)
        if request.is_group:
            logger.info(f"Skipping group message from {phone_number}")
            return WhatsAppIncomingResponse(
                success=True,
                message_id=request.message_id,
                error="Group messages are not processed"
            )
        
        # Detect language (with safe fallback)
        detected_language = language_detector.detect_language(message_content)
        
        # Safe fallback: if language detection returns null or unknown, keep as unknown
        if not detected_language or detected_language == 'unknown':
            detected_language = 'unknown'
            logger.warning("Language detection returned null/unknown, keeping as unknown")
        
        # Translate to Turkish if not already Turkish (and language is known)
        translated_content = None
        if detected_language and detected_language not in ('tr', 'unknown'):
            translated_content = translator.translate_to_turkish(
                message_content,
                source_language=detected_language
            )
            # If translation fails, fallback to original content (assume it's Turkish)
            if not translated_content:
                logger.warning("Translation failed, using original content for display")
                translated_content = None
        
        # Use translated content for display (Turkish), or original if already Turkish
        display_content = translated_content if translated_content else message_content
        
        # Find or create customer by phone number
        customer = None
        customer_response = (
            supabase
            .table("customers")
            .select("*")
            .eq("phone", phone_number)
            .execute()
        )
        
        if customer_response.data and len(customer_response.data) > 0:
            customer = customer_response.data[0]
            # Update customer name if we have a better one now
            if customer_name and customer_name != customer.get('name') and not customer['name'].startswith('WhatsApp'):
                pass  # Keep existing name if it's not a WhatsApp placeholder
            elif customer_name and customer['name'].startswith('WhatsApp'):
                # Update with real name if we got one
                supabase.table("customers").update({
                    'name': customer_name
                }).eq('id', customer['id']).execute()
                customer['name'] = customer_name
        else:
            # Create new customer
            customer_data = {
                'name': customer_name,
                'phone': phone_number,
                'email': f"{phone_number}@whatsapp.placeholder",  # Placeholder email
            }
            
            create_response = (
                supabase
                .table("customers")
                .insert(customer_data)
                .execute()
            )
            
            if not create_response.data:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to create customer"
                )
            
            customer = create_response.data[0]
            logger.info(f"Created new customer from WhatsApp: {phone_number}")
        
        # Find or create conversation (whatsapp channel)
        conversation = None
        conv_response = (
            supabase
            .table("conversations")
            .select("*")
            .eq("customer_id", customer['id'])
            .eq("channel", "whatsapp")
            .execute()
        )
        
        if conv_response.data and len(conv_response.data) > 0:
            conversation = conv_response.data[0]
        else:
            # Create new conversation
            conv_data = {
                'customer_id': customer['id'],
                'channel': 'whatsapp',
                'last_message': display_content[:200],
                'is_read': False,
                'last_message_at': None
            }
            
            create_conv_response = (
                supabase
                .table("conversations")
                .insert(conv_data)
                .execute()
            )
            
            if not create_conv_response.data:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to create conversation"
                )
            
            conversation = create_conv_response.data[0]
            logger.info(f"Created new WhatsApp conversation for customer: {customer['id']}")
        
        # Create message with translation
        message = message_service.create_customer_message(
            conversation_id=conversation['id'],
            content=display_content,  # Turkish translated content (for CRM display)
            original_content=message_content,  # Original message in customer's language
            original_language=detected_language,  # Detected language code
            customer_email=None  # No email for WhatsApp
        )
        
        # Update conversation with Turkish content (display_content)
        supabase.table("conversations").update({
            'last_message': display_content[:200],  # Turkish content for frontend
            'last_message_at': message['sent_at'],
            'is_read': False,
            'updated_at': message['sent_at']
        }).eq('id', conversation['id']).execute()
        
        logger.info(f"Processed WhatsApp message from {phone_number}, language: {detected_language}")
        
        return WhatsAppIncomingResponse(
            success=True,
            message_id=message['id'],
            conversation_id=conversation['id'],
            customer_id=customer['id'],
            detected_language=detected_language,
            translated_content=translated_content
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing incoming WhatsApp message: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process WhatsApp message: {str(e)}"
        )


@router.post("/send")
async def send_whatsapp_message(to: str, message: str):
    """
    Send a WhatsApp message via whatsapp-service
    """
    try:
        whatsapp_service = get_whatsapp_service()
        result = await whatsapp_service.send_message(to, message)
        
        if result.get('success'):
            return {
                "success": True,
                "message_id": result.get('messageId'),
                "timestamp": result.get('timestamp')
            }
        else:
            raise HTTPException(
                status_code=500,
                detail=result.get('error', 'Failed to send WhatsApp message')
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending WhatsApp message: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send WhatsApp message: {str(e)}"
        )


@router.get("/health")
async def whatsapp_health():
    """
    Check WhatsApp service health
    """
    try:
        whatsapp_service = get_whatsapp_service()
        health = await whatsapp_service.check_health()
        return health
    except Exception as e:
        logger.error(f"WhatsApp health check failed: {e}")
        return {
            "status": "error",
            "whatsapp_service": "unavailable",
            "error": str(e)
        }
