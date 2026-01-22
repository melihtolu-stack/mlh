"""
Test script for Hostinger SMTP connection
"""
import os
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import ssl
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
FROM_EMAIL = os.getenv("FROM_EMAIL")
TO_EMAIL = SMTP_USERNAME  # Send to self for testing

logger.info(f"Testing SMTP connection:")
logger.info(f"  Server: {SMTP_SERVER}")
logger.info(f"  Port: {SMTP_PORT}")
logger.info(f"  Username: {SMTP_USERNAME}")
logger.info(f"  From: {FROM_EMAIL}")
logger.info(f"  To: {TO_EMAIL}")

try:
    # Create message
    msg = MIMEMultipart('alternative')
    msg['From'] = f"CRM System <{FROM_EMAIL}>"
    msg['To'] = TO_EMAIL
    msg['Subject'] = "Hostinger SMTP Test"
    
    body = "This is a test email from CRM system."
    msg.attach(MIMEText(body, 'plain'))
    
    # Create SSL context
    context = ssl.create_default_context()
    context.check_hostname = False
    context.verify_mode = ssl.CERT_NONE
    
    logger.info(f"\nAttempting connection to {SMTP_SERVER}:{SMTP_PORT}...")
    
    if SMTP_PORT == 587:
        logger.info("Using STARTTLS (port 587)")
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=10) as server:
            logger.info("✓ SMTP connection established")
            server.starttls(context=context)
            logger.info("✓ TLS started")
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            logger.info("✓ Login successful")
            server.send_message(msg)
            logger.info("✓ Message sent successfully")
    else:
        logger.info(f"Using SSL connection (port {SMTP_PORT})")
        with smtplib.SMTP_SSL(
            SMTP_SERVER,
            SMTP_PORT,
            context=context,
            timeout=10
        ) as server:
            logger.info("✓ SMTP_SSL connection established")
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            logger.info("✓ Login successful")
            server.send_message(msg)
            logger.info("✓ Message sent successfully")
    
    logger.info("\n✅ SUCCESS: Email sent successfully!")
    logger.info(f"Check inbox at {TO_EMAIL}")
    
except smtplib.SMTPAuthenticationError as e:
    logger.error(f"\n❌ AUTHENTICATION ERROR: {e}")
    logger.error("Check your SMTP_USERNAME and SMTP_PASSWORD")
except smtplib.SMTPServerDisconnected as e:
    logger.error(f"\n❌ SERVER DISCONNECTED: {e}")
    logger.error("Check SMTP_SERVER and SMTP_PORT settings")
except smtplib.SMTPException as e:
    logger.error(f"\n❌ SMTP ERROR: {e}")
    logger.error(f"Error code: {getattr(e, 'smtp_code', 'N/A')}")
except Exception as e:
    logger.error(f"\n❌ UNEXPECTED ERROR: {e}")
    logger.error(f"Error type: {type(e).__name__}")
    import traceback
    traceback.print_exc()
