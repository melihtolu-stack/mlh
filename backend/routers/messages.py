"""
Messages Router
Handles message sending endpoints
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.supabase_client import supabase
from services.message_service import get_message_service
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

        # Get customer email
        customer_email = None
        if customer_id:
            customer_response = (
                supabase
                .table("customers")
                .select("email")
                .eq("id", customer_id)
                .execute()
            )
            if customer_response.data and len(customer_response.data) > 0:
                customer_email = customer_response.data[0].get('email')

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

            return MessageSendResponse(
                success=True,
                message_id=message.get('id'),
                email_sent=email_sent
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
