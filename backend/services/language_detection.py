from langdetect import detect
from deep_translator import GoogleTranslator


class LanguageDetectionService:
    def detect_language(self, text: str) -> str:
        try:
            return detect(text)
        except Exception:
            return "tr"

    def translate_to_turkish(self, text: str, source_lang: str) -> str:
        if source_lang == "tr":
            return text

        try:
            return GoogleTranslator(source=source_lang, target="tr").translate(text)
        except Exception:
            return text

    def translate_from_turkish(self, text: str, target_lang: str) -> str:
        if target_lang == "tr":
            return text

        try:
            return GoogleTranslator(source="tr", target=target_lang).translate(text)
        except Exception:
            return text


def get_language_detection_service():
    return LanguageDetectionService()
