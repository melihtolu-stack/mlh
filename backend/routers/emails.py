"""
Email Router
Handles incoming email webhooks and email-related endpoints
"""
from fastapi import APIRouter, HTTPException
from schemas.email import EmailIncomingRequest, EmailIncomingResponse
from services.email_parser import get_email_parser_service
from services.language_detection import get_language_detection_service
from services.translation_service import get_translation_service
from services.message_service import get_message_service
from services.media_service import get_media_service
from services.supabase_client import supabase
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/emails", tags=["Emails"])

@router.post("/incoming", response_model=EmailIncomingResponse)
async def handle_incoming_email(request: EmailIncomingRequest):
    """
    Handle incoming email webhook
    Processes email, extracts data, detects language, translates to Turkish,
    and creates conversation/message in CRM
    """
    try:
        # Initialize services
        email_parser = get_email_parser_service()
        language_detector = get_language_detection_service()
        translator = get_translation_service()
        message_service = get_message_service()
        
        # Parse email content
        email_body = request.html_body if request.html_body else request.body
        parsed_data = email_parser.parse_email_content(
            email_body=email_body,
            email_subject=request.subject
        )
        
        # Extract data (use parsed data or fallback to email headers)
        customer_name = parsed_data.get('name') or request.from_name or "Unknown Customer"
        customer_phone = parsed_data.get('phone') or ""
        customer_email = parsed_data.get('email') or request.from_email
        message_content = parsed_data.get('content') or request.body
        attachments = request.attachments or []

        if not message_content and attachments:
            message_content = "Medya"
        
        if not message_content:
            raise HTTPException(
                status_code=400,
                detail="No message content found in email"
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
        
        # Find or create customer
        customer = None
        customer_response = (
            supabase
            .table("customers")
            .select("*")
            .eq("email", customer_email)
            .execute()
        )
        
        if customer_response.data and len(customer_response.data) > 0:
            customer = customer_response.data[0]
        else:
            # Create new customer
            customer_data = {
                'name': customer_name,
                'email': customer_email,
                'phone': customer_phone or customer_email,  # Use email as fallback
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
        
        # Find or create conversation (email channel)
        conversation = None
        conv_response = (
            supabase
            .table("conversations")
            .select("*")
            .eq("customer_id", customer['id'])
            .eq("channel", "email")
            .execute()
        )
        
        if conv_response.data and len(conv_response.data) > 0:
            conversation = conv_response.data[0]
        else:
            # Create new conversation
            conv_data = {
                'customer_id': customer['id'],
                'channel': 'email',
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
        
        # Process attachments
        media_service = get_media_service()
        media = media_service.process_attachments(attachments, conversation['id'])

        # Create message with translation
        # Pass Turkish content as 'content', original as 'original_content', and detected language
        message = message_service.create_customer_message(
            conversation_id=conversation['id'],
            content=display_content,  # Turkish translated content (for CRM display)
            original_content=message_content,  # Original message in customer's language
            original_language=detected_language,  # Detected language code
            customer_email=customer_email,
            media=media
        )
        
        # Update conversation with Turkish content (display_content)
        supabase.table("conversations").update({
            'last_message': display_content[:200],  # Turkish content for frontend
            'last_message_at': message['sent_at'],
            'is_read': False,
            'updated_at': message['sent_at']
        }).eq('id', conversation['id']).execute()
        
        return EmailIncomingResponse(
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
        logger.error(f"Error processing incoming email: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process email: {str(e)}"
        )
