"""
Message Service
Handles message creation with automatic translation and language detection
"""
from typing import Optional, Dict
from services.supabase_client import supabase
from services.language_detection import get_language_detection_service
from services.translation_service import get_translation_service
import logging
import os

logger = logging.getLogger(__name__)

class MessageService:
    """
    Service for handling messages with translation support
    """
    
    def __init__(self):
        self.language_detector = get_language_detection_service()
        self.translator = get_translation_service()
    
    def create_customer_message(self, conversation_id: str, content: str,
                                original_content: Optional[str] = None,
                                original_language: Optional[str] = None,
                                customer_email: Optional[str] = None,
                                media: Optional[list] = None) -> Optional[Dict]:
        """
        Create a customer message with translation support
        
        Args:
            conversation_id: Conversation ID
            content: Turkish translated content (for display in CRM)
            original_content: Original message content in customer's language
            original_language: ISO 639-1 language code of original message (e.g., 'en', 'de', 'fr')
            customer_email: Customer email (for future use)
            
        Returns:
            Created message dictionary or None if failed
        """
        try:
            # If original_content not provided, assume content is original (backward compatibility)
            if original_content is None:
                original_content = content
            
            # If original_language not provided, default to Turkish (backward compatibility)
            if original_language is None:
                original_language = 'tr'
            
            # translated_content is the same as content (Turkish version)
            translated_content = content
            
            # Insert message into database
            message_data = {
                'conversation_id': conversation_id,
                'sender': 'customer',
                'content': content,  # Turkish version for display in CRM
                'original_content': original_content,  # Original language content
                'original_language': original_language,  # Language code (e.g., 'en', 'de', 'fr')
                'translated_content': translated_content,  # Turkish translation (same as content)
                'is_read': False,
                'media': media
            }
            
            response = (
                supabase
                .table("messages")
                .insert(message_data)
                .execute()
            )
            
            if not response.data:
                raise Exception(f"Insert failed: {response}")
            
            logger.info(f"Created customer message with language: {original_language}")
            return response.data[0]
            
        except Exception as e:
            logger.error(f"Error creating customer message: {e}")
            raise
    
    def create_agent_message(self, conversation_id: str, turkish_content: str,
                            customer_language: Optional[str] = None,
                            customer_email: Optional[str] = None,
                            media: Optional[list] = None) -> Dict:
        """
        Create an agent message (in Turkish) and optionally send translated version to customer
        
        Args:
            conversation_id: Conversation ID
            turkish_content: Message content in Turkish (from agent)
            customer_language: Customer's original language (for translation)
            customer_email: Customer email (for sending reply)
            
        Returns:
            Created message dictionary with email_sent flag
        """
        email_sent = False
        send_blocked_reason = None
        try:
            # Insert message into database (always in Turkish)
            message_data = {
                'conversation_id': conversation_id,
                'sender': 'agent',
                'content': turkish_content,  # Turkish content
                'original_content': turkish_content,  # Same as content for agent messages
                'original_language': 'tr',
                'translated_content': turkish_content,  # Same as content
                'is_read': True,
                'media': media
            }
            
            response = (
                supabase
                .table("messages")
                .insert(message_data)
                .execute()
            )
            
            if not response.data:
                raise Exception(f"Insert failed: {response}")
            
            # If customer email provided, check if this is an email conversation and send reply
            if customer_email:
                from services.email_service import get_email_service
                email_service = get_email_service()
                
                # Check configuration with detailed logging
                if not email_service.is_configured():
                    logger.error("Email service is not configured. Please check SMTP settings in .env file")
                    logger.error(f"SMTP_SERVER: {os.getenv('SMTP_SERVER')}")
                    logger.error(f"SMTP_PORT: {os.getenv('SMTP_PORT')}")
                    logger.error(f"SMTP_USERNAME: {os.getenv('SMTP_USERNAME')}")
                    logger.error(f"SMTP_PASSWORD: {'***' if os.getenv('SMTP_PASSWORD') else 'NOT SET'}")
                
                if email_service.is_configured():
                    try:
                        # Get conversation details to check channel and customer name
                        conv_response = (
                            supabase
                            .table("conversations")
                            .select("customer_id, channel")
                            .eq("id", conversation_id)
                            .execute()
                        )
                        
                        # Only send email if conversation channel is "email"
                        is_email_channel = False
                        customer_name = "Customer"
                        
                        if conv_response.data and len(conv_response.data) > 0:
                            conv_data = conv_response.data[0]
                            is_email_channel = conv_data.get('channel') == 'email'
                            
                            customer_id = conv_data.get('customer_id')
                            if customer_id:
                                customer_response = (
                                    supabase
                                    .table("customers")
                                    .select("name")
                                    .eq("id", customer_id)
                                    .execute()
                                )
                                if customer_response.data and len(customer_response.data) > 0:
                                    customer_name = customer_response.data[0].get('name', 'Customer')
                        
                        # Send email reply if this is an email conversation
                        if is_email_channel:
                            # If customer language is unknown/empty, do not send
                            if not customer_language or customer_language == 'unknown':
                                send_blocked_reason = "Customer language is unknown. Reply not sent."
                                logger.warning(f"Email reply blocked for {customer_email}: {send_blocked_reason}")
                                target_language = None
                            else:
                                target_language = customer_language
                            
                            if target_language:
                                logger.info(f"Translating agent message from Turkish to {target_language} for customer {customer_email}")
                            
                            # Get last customer message for threading (optional)
                            last_customer_msg = None
                            try:
                                msg_response = (
                                    supabase
                                    .table("messages")
                                    .select("id")
                                    .eq("conversation_id", conversation_id)
                                    .eq("sender", "customer")
                                    .order("sent_at", desc=True)
                                    .limit(1)
                                    .execute()
                                )
                                if msg_response.data and len(msg_response.data) > 0:
                                    last_customer_msg = msg_response.data[0]
                            except Exception as e:
                                logger.warning(f"Could not get last customer message for threading: {e}")
                            
                            if target_language:
                                # Send translated email
                                email_sent_result = email_service.send_translated_reply(
                                    to_email=customer_email,
                                    customer_name=customer_name,
                                    turkish_message=turkish_content,
                                    target_language=target_language,
                                    original_language='tr',
                                    original_subject=None,  # Can be enhanced to get from conversation metadata
                                    message_id=last_customer_msg.get('id') if last_customer_msg else None,
                                    attachments=media
                                )
                                
                                email_sent = email_sent_result
                                if email_sent:
                                    logger.info(f"Sent email reply to {customer_email} in language: {target_language}")
                                else:
                                    logger.error(f"Failed to send email reply to {customer_email}")
                    except Exception as e:
                        logger.warning(f"Failed to send email reply: {e}")
            
            logger.info(f"Created agent message in Turkish")
            result = response.data[0].copy()
            result['email_sent'] = email_sent
            if send_blocked_reason:
                result['send_blocked_reason'] = send_blocked_reason
            return result
            
        except Exception as e:
            logger.error(f"Error creating agent message: {e}")
            raise
    
    def get_customer_language(self, conversation_id: str) -> Optional[str]:
        """
        Get the original language of customer messages in a conversation
        
        Args:
            conversation_id: Conversation ID
            
        Returns:
            Language code or None if not found
        """
        try:
            response = (
                supabase
                .table("messages")
                .select("original_language, content, original_content")
                .eq("conversation_id", conversation_id)
                .eq("sender", "customer")
                .order("sent_at", desc=True)
                .limit(1)
                .execute()
            )
            
            if response.data and len(response.data) > 0:
                original_language = response.data[0].get('original_language')
                logger.info(f"Found customer language for conversation {conversation_id}: {original_language}")
                return original_language
            
            logger.warning(f"No customer messages found for conversation {conversation_id}")
            return None
            
        except Exception as e:
            logger.error(f"Error getting customer language: {e}", exc_info=True)
            return None

# Singleton instance
_message_service = None

def get_message_service() -> MessageService:
    """Get singleton instance of MessageService"""
    global _message_service
    if _message_service is None:
        _message_service = MessageService()
    return _message_service
