"""
Messages Router
Handles message sending endpoints
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from services.supabase_client import supabase
from services.message_service import get_message_service
from services.whatsapp_service import get_whatsapp_service
from services.translation_service import get_translation_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/messages", tags=["Messages"])


class MessageSendRequest(BaseModel):
    conversation_id: str
    content: Optional[str] = None
    media: Optional[List[Dict]] = None


class MessageSendResponse(BaseModel):
    success: bool
    message_id: str
    email_sent: bool = False
    blocked_reason: str | None = None
    error: str | None = None


@router.post("/send", response_model=MessageSendResponse)
async def send_message(request: MessageSendRequest):
    """
    Send a message as an agent
    - Saves message in Turkish to database
    - Detects customer's language from conversation
    - Translates message to customer's language
    - Sends email if conversation channel is email
    """
    try:
        conversation_id = request.conversation_id
        raw_content = (request.content or "").strip()
        media = request.media or []
        has_media = len(media) > 0

        if not raw_content and not has_media:
            raise HTTPException(
                status_code=400,
                detail="Message content cannot be empty"
            )

        # Get conversation details
        conv_response = (
            supabase
            .table("conversations")
            .select("customer_id, channel")
            .eq("id", conversation_id)
            .execute()
        )

        if not conv_response.data or len(conv_response.data) == 0:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found"
            )

        conversation = conv_response.data[0]
        customer_id = conversation.get('customer_id')
        channel = conversation.get('channel', 'whatsapp')

        # Get customer email and phone
        customer_email = None
        customer_phone = None
        if customer_id:
            customer_response = (
                supabase
                .table("customers")
                .select("email, phone")
                .eq("id", customer_id)
                .execute()
            )
            if customer_response.data and len(customer_response.data) > 0:
                customer_email = customer_response.data[0].get('email')
                customer_phone = customer_response.data[0].get('phone')

        # Get customer's language from previous messages
        message_service = get_message_service()
        customer_language = message_service.get_customer_language(conversation_id)

        # Use placeholder content for media-only messages
        turkish_content = raw_content or "Medya"

        # Create agent message (this will handle translation and email sending)
        try:
            message = message_service.create_agent_message(
                conversation_id=conversation_id,
                turkish_content=turkish_content,
                customer_language=customer_language,
                customer_email=customer_email,
                media=media
            )

            # Update conversation
            supabase.table("conversations").update({
                'last_message': turkish_content[:200],
                'last_message_at': message.get('sent_at'),
                'is_read': True,
                'updated_at': message.get('sent_at')
            }).eq('id', conversation_id).execute()

            # Get email_sent status from message_service response
            email_sent = message.get('email_sent', False)
            
            # Log email sending status
            if channel == 'email':
                if email_sent:
                    logger.info(f"Email successfully sent for conversation {conversation_id}")
                else:
                    logger.warning(f"Email was NOT sent for conversation {conversation_id} - check logs above for details")
            
            # Handle WhatsApp channel
            whatsapp_sent = False
            blocked_reason = message.get('send_blocked_reason')
            if channel == 'whatsapp' and customer_phone:
                try:
                    translated_message = raw_content
                    if raw_content:
                        if not customer_language or customer_language == 'unknown':
                            blocked_reason = "Customer language is unknown. WhatsApp reply not sent."
                            logger.warning(f"WhatsApp reply blocked for {customer_phone}: {blocked_reason}")
                            translated_message = None
                        else:
                            if customer_language != 'tr':
                                translator = get_translation_service()
                                translated_message = translator.translate_from_turkish(
                                    raw_content,
                                    target_language=customer_language
                                )
                                if not translated_message:
                                    logger.warning("Translation failed, sending Turkish content as-is")
                                    translated_message = raw_content
                                else:
                                    logger.info(f"Translated message from Turkish to {customer_language}")
                    elif has_media:
                        translated_message = None

                    if translated_message is not None or has_media:
                        whatsapp_service = get_whatsapp_service()
                        result = await whatsapp_service.send_message(
                            customer_phone,
                            translated_message or "",
                            media=media
                        )
                        
                        if result.get('success'):
                            whatsapp_sent = True
                            logger.info(f"WhatsApp message successfully sent to {customer_phone}")
                        else:
                            logger.error(f"Failed to send WhatsApp message: {result.get('error')}")
                        
                except Exception as e:
                    logger.error(f"Error sending WhatsApp message: {e}", exc_info=True)

            return MessageSendResponse(
                success=True,
                message_id=message.get('id'),
                email_sent=email_sent or whatsapp_sent,  # Return True if either email or WhatsApp sent
                blocked_reason=blocked_reason
            )

        except Exception as e:
            logger.error(f"Error creating agent message: {e}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create message: {str(e)}"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending message: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send message: {str(e)}"
        )
