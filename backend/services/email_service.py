"""
Email Service
Handles sending and receiving emails
Supports SMTP for sending and webhook for receiving
"""
import ssl
import smtplib
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import Optional, Dict, List
import os
import logging
import httpx
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class EmailService:
    """
    Service for sending emails via SMTP
    For receiving emails, use webhook endpoint (more stable than IMAP)
    """
    
    def __init__(self):
        # Ensure .env is loaded
        load_dotenv()
        
        self.smtp_server = os.getenv("SMTP_SERVER")
        self.smtp_port = int(os.getenv("SMTP_PORT", "465"))
        self.smtp_username = os.getenv("SMTP_USERNAME")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.from_email = os.getenv("FROM_EMAIL", self.smtp_username)
        self.from_name = os.getenv("FROM_NAME", "CRM System")
        
        # Log configuration status (without exposing password)
        logger.info(f"EmailService initialized - Server: {self.smtp_server}, Port: {self.smtp_port}, Username: {self.smtp_username}, From: {self.from_email}")
        if not self.smtp_username or not self.smtp_password:
            logger.warning("SMTP credentials not configured - SMTP_USERNAME or SMTP_PASSWORD is missing")
        if not self.smtp_server:
            logger.warning("SMTP server not configured - SMTP_SERVER is missing")
    
    def send_email(self, to_email: str, subject: str, body: str, 
                   is_html: bool = False, reply_to: Optional[str] = None,
                   in_reply_to: Optional[str] = None,
                   attachments: Optional[List[Dict]] = None) -> bool:
        """
        Send an email via SMTP
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            body: Email body content
            is_html: Whether body is HTML format
            reply_to: Reply-To email address (for threading)
            in_reply_to: In-Reply-To header value (for threading)
            
        Returns:
            True if email sent successfully, False otherwise
        """
        if not self.smtp_username or not self.smtp_password:
            logger.error("SMTP credentials not configured")
            return False
        
        if not self.smtp_server:
            logger.error("SMTP server not configured")
            return False
        
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Add Reply-To header if provided
            if reply_to:
                msg['Reply-To'] = reply_to
            else:
                msg['Reply-To'] = self.from_email
            
            # Add In-Reply-To header for email threading
            if in_reply_to:
                msg['In-Reply-To'] = in_reply_to
                msg['References'] = in_reply_to
            
            # Add body
            if is_html:
                msg.attach(MIMEText(body, 'html'))
            else:
                msg.attach(MIMEText(body, 'plain'))

            # Attach files if provided
            if attachments:
                for attachment in attachments:
                    try:
                        filename = attachment.get("name") or "attachment"
                        content_type = attachment.get("type") or "application/octet-stream"
                        data = None

                        if attachment.get("data"):
                            data = base64.b64decode(attachment.get("data"))
                        elif attachment.get("url"):
                            resp = httpx.get(attachment.get("url"), timeout=20.0)
                            if resp.status_code == 200:
                                data = resp.content

                        if not data:
                            logger.warning(f"Skipping attachment without data: {filename}")
                            continue

                        maintype, subtype = content_type.split("/", 1) if "/" in content_type else ("application", "octet-stream")
                        part = MIMEBase(maintype, subtype)
                        part.set_payload(data)
                        encoders.encode_base64(part)
                        part.add_header("Content-Disposition", f'attachment; filename="{filename}"')
                        msg.attach(part)
                    except Exception as e:
                        logger.warning(f"Failed to attach file {attachment.get('name')}: {e}")
            
            # Send email with appropriate method based on port
            context = ssl.create_default_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE

            # Port 587 uses STARTTLS, port 465 uses SSL
            logger.info(f"Attempting to send email via {self.smtp_server}:{self.smtp_port} to {to_email}")
            
            if self.smtp_port == 587:
                logger.info("Using STARTTLS (port 587)")
                with smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=10) as server:
                    logger.info("SMTP connection established, starting TLS...")
                    server.starttls(context=context)
                    logger.info("TLS started, attempting login...")
                    server.login(self.smtp_username, self.smtp_password)
                    logger.info("Login successful, sending message...")
                    server.send_message(msg)
                    logger.info("Message sent successfully")
            else:
                # Port 465 or other SSL ports
                logger.info(f"Using SSL connection (port {self.smtp_port})")
                with smtplib.SMTP_SSL(
                    self.smtp_server,
                    self.smtp_port,
                    context=context,
                    timeout=10
                ) as server:
                    logger.info("SMTP_SSL connection established, attempting login...")
                    server.login(self.smtp_username, self.smtp_password)
                    logger.info("Login successful, sending message...")
                    server.send_message(msg)
                    logger.info("Message sent successfully")
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP authentication failed for {self.smtp_username}@{self.smtp_server}:{self.smtp_port} - {e}")
            logger.error(f"Error details: {str(e)}")
            return False
        except smtplib.SMTPRecipientsRefused as e:
            logger.error(f"SMTP recipient refused: {to_email} - {e}")
            return False
        except smtplib.SMTPServerDisconnected as e:
            logger.error(f"SMTP server disconnected from {self.smtp_server}:{self.smtp_port} - {e}")
            return False
        except smtplib.SMTPException as e:
            logger.error(f"SMTP error sending email to {to_email}: {e}")
            logger.error(f"SMTP error code: {getattr(e, 'smtp_code', 'N/A')}, error: {getattr(e, 'smtp_error', 'N/A')}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending email to {to_email}: {e}", exc_info=True)
            logger.error(f"Error type: {type(e).__name__}")
            return False
    
    def send_translated_reply(self, to_email: str, customer_name: str, 
                             turkish_message: str, target_language: str,
                             original_language: Optional[str] = None,
                             original_subject: Optional[str] = None,
                             message_id: Optional[str] = None,
                             attachments: Optional[List[Dict]] = None) -> bool:
        """
        Send a translated reply email to customer
        
        Args:
            to_email: Customer email address
            customer_name: Customer name for personalization
            turkish_message: Message in Turkish (from agent)
            target_language: Target language code for translation
            original_language: Original language of customer's message (optional)
            original_subject: Original email subject for threading (optional)
            message_id: Original message ID for threading (optional)
            
        Returns:
            True if email sent successfully, False otherwise
        """
        from services.translation_service import get_translation_service
        
        # Translate message to customer's language
        translation_service = get_translation_service()
        translated_message = translation_service.translate_from_turkish(
            turkish_message, 
            target_language
        )
        
        if not translated_message:
            logger.error(f"Failed to translate message to {target_language}")
            translated_message = turkish_message  # Fallback to Turkish
        
        # Create email subject with Re: prefix if original subject exists
        if original_subject:
            # Remove existing Re: prefix if present
            subject = original_subject
            if not subject.startswith("Re:") and not subject.startswith("RE:"):
                subject = f"Re: {original_subject}"
        else:
            subject = "Re: Your Message"
        
        # Create email body
        body = f"""
Dear {customer_name},

{translated_message}

Best regards,
{self.from_name}
"""
        
        # Use message_id for threading if available
        in_reply_to = None
        if message_id:
            in_reply_to = message_id
        
        return self.send_email(
            to_email=to_email, 
            subject=subject, 
            body=body, 
            is_html=False,
            reply_to=self.from_email,
            in_reply_to=in_reply_to,
            attachments=attachments
        )
    
    def is_configured(self) -> bool:
        """
        Check if email service is properly configured
        
        Returns:
            True if configured, False otherwise
        """
        # Reload environment variables in case they were updated
        load_dotenv()
        
        # Re-check configuration
        smtp_username = os.getenv("SMTP_USERNAME")
        smtp_password = os.getenv("SMTP_PASSWORD")
        smtp_server = os.getenv("SMTP_SERVER")
        
        is_config = bool(smtp_username and smtp_password and smtp_server)
        
        if not is_config:
            logger.warning(f"Email service not configured - Username: {bool(smtp_username)}, Password: {bool(smtp_password)}, Server: {bool(smtp_server)}")
        
        return is_config

# Singleton instance
_email_service = None

def get_email_service() -> EmailService:
    """Get singleton instance of EmailService"""
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service
