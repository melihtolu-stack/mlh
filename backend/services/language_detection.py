import re
from langdetect import detect, detect_langs
from deep_translator import GoogleTranslator


class LanguageDetectionService:
    def detect_language(self, text: str) -> str:
        if not text or not isinstance(text, str):
            return "unknown"

        # Normalize: keep letters and spaces only
        normalized = re.sub(r"[^A-Za-zÀ-ÖØ-öø-ÿ\s]", " ", text)
        normalized = re.sub(r"\s+", " ", normalized).strip()

        # Short or empty content is unreliable for detection
        if len(normalized) < 5:
            return "unknown"

        try:
            candidates = detect_langs(normalized)
            if not candidates:
                return "unknown"

            top = candidates[0]
            top_lang = getattr(top, "lang", None)
            top_prob = getattr(top, "prob", 0.0)

            # If confidence is low or ambiguous, return unknown
            second_prob = getattr(candidates[1], "prob", 0.0) if len(candidates) > 1 else 0.0
            if top_prob < 0.85 or (top_prob - second_prob) < 0.2:
                return "unknown"

            return top_lang or "unknown"
        except Exception:
            return "unknown"

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
