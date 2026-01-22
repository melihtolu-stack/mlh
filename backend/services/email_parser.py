"""
Email Parser Service
Extracts structured data from email content
"""
import re
from typing import Dict, Optional
from bs4 import BeautifulSoup
import logging

logger = logging.getLogger(__name__)

class EmailParserService:
    """
    Service for parsing email content and extracting structured data
    """
    
    # Phone number patterns (international and local formats)
    PHONE_PATTERNS = [
        r'\+?\d{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}',  # International
        r'0\d{3}[-.\s]?\d{3}[-.\s]?\d{2}[-.\s]?\d{2}',  # Turkish format
        r'\(\d{3}\)\s?\d{3}[-.\s]?\d{4}',  # US format
    ]
    
    # Email pattern
    EMAIL_PATTERN = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    
    def __init__(self):
        pass
    
    def parse_email_content(self, email_body: str, email_subject: str = "") -> Dict[str, Optional[str]]:
        """
        Parse email content and extract structured data
        
        Args:
            email_body: Email body content (can be HTML or plain text)
            email_subject: Email subject line
            
        Returns:
            Dictionary with extracted fields:
            - name: Full name
            - phone: Phone number
            - email: Email address
            - content: Message content
        """
        # Extract text from HTML if needed
        text_content = self._extract_text_from_html(email_body)
        
        # Combine subject and body for parsing
        full_text = f"{email_subject}\n{text_content}"
        
        # Extract fields
        extracted_data = {
            'name': self._extract_name(full_text),
            'phone': self._extract_phone(full_text),
            'email': self._extract_email(full_text),
            'content': self._clean_content(text_content)
        }
        
        logger.info(f"Extracted data from email: {extracted_data}")
        return extracted_data
    
    def _extract_text_from_html(self, html_content: str) -> str:
        """
        Extract plain text from HTML content
        
        Args:
            html_content: HTML content
            
        Returns:
            Plain text content
        """
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
            return soup.get_text(separator='\n', strip=True)
        except Exception as e:
            logger.warning(f"Error parsing HTML: {e}, using original content")
            return html_content
    
    def _extract_name(self, text: str) -> Optional[str]:
        """
        Extract name from text
        Looks for common name patterns and salutations
        
        Args:
            text: Text to search
            
        Returns:
            Extracted name or None
        """
        # Common patterns for names
        patterns = [
            r'(?:Name|İsim|Ad|Ad Soyad|Full Name|Name:)\s*:?\s*([A-ZÇĞİÖŞÜ][a-zçğıöşü]+(?:\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]+)+)',
            r'^(?:Dear|Sayın|Merhaba|Hello|Hi)\s+([A-ZÇĞİÖŞÜ][a-zçğıöşü]+(?:\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]+)+)',
            r'([A-ZÇĞİÖŞÜ][a-zçğıöşü]+\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]+)',  # Two capitalized words
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                name = match.group(1).strip()
                # Filter out common false positives
                if name.lower() not in ['thank you', 'best regards', 'sincerely', 'saygılarımla']:
                    return name
        
        return None
    
    def _extract_phone(self, text: str) -> Optional[str]:
        """
        Extract phone number from text
        
        Args:
            text: Text to search
            
        Returns:
            Extracted phone number or None
        """
        for pattern in self.PHONE_PATTERNS:
            matches = re.findall(pattern, text)
            if matches:
                # Return the first valid phone number
                phone = matches[0].strip()
                # Clean up the phone number
                phone = re.sub(r'[-.\s()]', '', phone)
                return phone
        
        return None
    
    def _extract_email(self, text: str) -> Optional[str]:
        """
        Extract email address from text
        
        Args:
            text: Text to search
            
        Returns:
            Extracted email address or None
        """
        matches = re.findall(self.EMAIL_PATTERN, text)
        if matches:
            # Return the first email (skip common no-reply addresses if needed)
            for email in matches:
                if 'noreply' not in email.lower() and 'no-reply' not in email.lower():
                    return email.lower()
            return matches[0].lower()
        
        return None
    
    def _clean_content(self, text: str) -> str:
        """
        Clean and normalize message content
        
        Args:
            text: Raw text content
            
        Returns:
            Cleaned text content
        """
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove common email signatures
        text = re.sub(r'(?i)(best regards|sincerely|saygılarımla|--\s*$).*$', '', text, flags=re.MULTILINE)
        return text.strip()

# Singleton instance
_email_parser_service = None

def get_email_parser_service() -> EmailParserService:
    """Get singleton instance of EmailParserService"""
    global _email_parser_service
    if _email_parser_service is None:
        _email_parser_service = EmailParserService()
    return _email_parser_service
