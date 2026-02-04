"""
Messages Router
Handles message sending endpoints
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.supabase_client import supabase
from services.message_service import get_message_service
from services.whatsapp_service import get_whatsapp_service
from services.translation_service import get_translation_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/messages", tags=["Messages"])


class MessageSendRequest(BaseModel):
    conversation_id: str
    content: str


class MessageSendResponse(BaseModel):
    success: bool
    message_id: str
    email_sent: bool = False
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
        turkish_content = request.content.strip()

        if not turkish_content:
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

        # Create agent message (this will handle translation and email sending)
        try:
            message = message_service.create_agent_message(
                conversation_id=conversation_id,
                turkish_content=turkish_content,
                customer_language=customer_language,
                customer_email=customer_email
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
            if channel == 'whatsapp' and customer_phone:
                try:
                    # Translate message to customer's language
                    translated_message = turkish_content
                    if customer_language and customer_language != 'tr' and customer_language != 'unknown':
                        translator = get_translation_service()
                        translated_message = translator.translate_from_turkish(
                            turkish_content,
                            target_language=customer_language
                        )
                        if not translated_message:
                            logger.warning(f"Translation failed, sending Turkish content as-is")
                            translated_message = turkish_content
                        else:
                            logger.info(f"Translated message from Turkish to {customer_language}")
                    
                    # Send WhatsApp message
                    whatsapp_service = get_whatsapp_service()
                    result = await whatsapp_service.send_message(customer_phone, translated_message)
                    
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
                email_sent=email_sent or whatsapp_sent  # Return True if either email or WhatsApp sent
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
