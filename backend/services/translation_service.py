"""
Translation Service
Production-safe translation service using deep-translator
Uses Google Translate via deep-translator library
Never raises exceptions - always returns original text on failure
"""
from typing import Optional
from deep_translator import GoogleTranslator
import logging

logger = logging.getLogger(__name__)

class TranslationService:
    """
    Production-safe service for translating text between languages
    Uses deep-translator.GoogleTranslator for Google Translate API
    Never raises exceptions - returns original text on any failure
    """
    
    def __init__(self, provider: str = "google"):
        """
        Initialize translation service
        
        Args:
            provider: Translation provider (currently only 'google' supported)
        """
        self.provider = provider
        if provider != "google":
            logger.warning(f"Unsupported translation provider: {provider}, using 'google'")
            self.provider = "google"
    
    def translate_to_turkish(self, text: str, source_language: Optional[str] = None) -> str:
        """
        Translate text to Turkish
        
        Args:
            text: Text to translate
            source_language: Source language code (optional, will auto-detect if None)
            
        Returns:
            Translated text in Turkish, or original text if translation fails
            Never returns None - always returns a string (original text as fallback)
        """
        # Validate input
        if not text or not isinstance(text, str) or not text.strip():
            return text or ""
        
        # If already Turkish, return as is
        if source_language == 'tr':
            return text
        
        try:
            # Create translator instance
            if source_language:
                # Translate from specific language to Turkish
                translator = GoogleTranslator(source=source_language, target='tr')
            else:
                # Auto-detect source language and translate to Turkish
                translator = GoogleTranslator(source='auto', target='tr')
            
            # Perform translation
            translated_text = translator.translate(text)
            
            # Validate result
            if translated_text and isinstance(translated_text, str) and translated_text.strip():
                logger.info(f"Successfully translated text to Turkish (source: {source_language or 'auto'})")
                return translated_text
            else:
                logger.warning("Translation returned empty result, using original text")
                return text
                
        except Exception as e:
            # Never raise exceptions - return original text on any failure
            logger.error(f"Error translating to Turkish: {e}, returning original text")
            return text
    
    def translate_from_turkish(self, text: str, target_language: str) -> str:
        """
        Translate text from Turkish to target language
        
        Args:
            text: Turkish text to translate
            target_language: Target language code (e.g., 'en', 'de', 'fr')
            
        Returns:
            Translated text in target language, or original text if translation fails
            Never returns None - always returns a string (original text as fallback)
        """
        # Validate input
        if not text or not isinstance(text, str) or not text.strip():
            return text or ""
        
        # If target is Turkish, return as is
        if target_language == 'tr':
            return text
        
        # Validate target language
        if not target_language or not isinstance(target_language, str):
            logger.warning(f"Invalid target_language: {target_language}, returning original text")
            return text
        
        try:
            # Create translator instance
            translator = GoogleTranslator(source='tr', target=target_language)
            
            # Perform translation
            translated_text = translator.translate(text)
            
            # Validate result
            if translated_text and isinstance(translated_text, str) and translated_text.strip():
                logger.info(f"Successfully translated text from Turkish to {target_language}")
                return translated_text
            else:
                logger.warning(f"Translation to {target_language} returned empty result, using original text")
                return text
                
        except Exception as e:
            # Never raise exceptions - return original text on any failure
            logger.error(f"Error translating from Turkish to {target_language}: {e}, returning original text")
            return text
    
    def translate(self, text: str, source_language: Optional[str] = None, 
                  target_language: str = 'tr') -> str:
        """
        Generic translate method
        
        Args:
            text: Text to translate
            source_language: Source language code (optional, will auto-detect if None)
            target_language: Target language code (default: 'tr' for Turkish)
            
        Returns:
            Translated text, or original text if translation fails
            Never returns None - always returns a string (original text as fallback)
        """
        if target_language == 'tr':
            return self.translate_to_turkish(text, source_language)
        elif source_language == 'tr':
            return self.translate_from_turkish(text, target_language)
        else:
            # Validate input
            if not text or not isinstance(text, str) or not text.strip():
                return text or ""
            
            try:
                # Create translator instance
                source = source_language if source_language else 'auto'
                translator = GoogleTranslator(source=source, target=target_language)
                
                # Perform translation
                translated_text = translator.translate(text)
                
                # Validate result
                if translated_text and isinstance(translated_text, str) and translated_text.strip():
                    logger.info(f"Successfully translated text from {source} to {target_language}")
                    return translated_text
                else:
                    logger.warning(f"Translation returned empty result, using original text")
                    return text
                    
            except Exception as e:
                # Never raise exceptions - return original text on any failure
                logger.error(f"Error translating from {source_language or 'auto'} to {target_language}: {e}, returning original text")
                return text

# Singleton instance
_translation_service = None

def get_translation_service(provider: str = "google") -> TranslationService:
    """
    Get singleton instance of TranslationService
    
    Args:
        provider: Translation provider name
        
    Returns:
        TranslationService instance
    """
    global _translation_service
    if _translation_service is None:
        _translation_service = TranslationService(provider=provider)
    return _translation_service
