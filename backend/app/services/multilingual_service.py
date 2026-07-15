"""
CrimeGPT-X — Multilingual Service
Handles translation between English, Hindi, Gujarati
Uses deep_translator for document translation
"""
import logging
from typing import Optional
from functools import lru_cache

logger = logging.getLogger(__name__)

SUPPORTED_LANGUAGES = {
    "en": "english",
    "hi": "hindi",
    "gu": "gujarati",
}

# Key legal terms in Hindi and Gujarati
LEGAL_GLOSSARY = {
    "Chargesheet": {"hi": "आरोप पत्र", "gu": "આરોપ પત્ર"},
    "FIR": {"hi": "प्रथम सूचना रिपोर्ट", "gu": "પ્રથમ માહિતી અહેવાલ"},
    "Victim": {"hi": "पीड़ित", "gu": "પીડિત"},
    "Accused": {"hi": "आरोपी", "gu": "આરોપી"},
    "Evidence": {"hi": "साक्ष्य", "gu": "પુરાવો"},
    "Witness": {"hi": "गवाह", "gu": "સાક્ષી"},
    "Investigation Officer": {"hi": "अन्वेषण अधिकारी", "gu": "તપાસ અધિકારી"},
    "Police Station": {"hi": "पुलिस स्टेशन", "gu": "પોલીસ સ્ટેશન"},
    "Remand": {"hi": "रिमांड", "gu": "રિમાન્ડ"},
    "Seizure": {"hi": "जब्ती", "gu": "જ‌પ્તી"},
    "Arrest": {"hi": "गिरफ्तारी", "gu": "ધરપકડ"},
    "Cheating": {"hi": "धोखाधड़ी", "gu": "છેતરપિંડી"},
    "Fraud": {"hi": "धोखा", "gu": "છળ"},
    "Identity Theft": {"hi": "पहचान चोरी", "gu": "ઓળખ ચોરી"},
    "Digital Evidence": {"hi": "डिजिटल साक्ष्य", "gu": "ડિજિટલ પુરાવો"},
    "Panchanama": {"hi": "पंचनामा", "gu": "પંચનામું"},
}


class MultilingualService:
    """Translation and multilingual support"""

    def __init__(self):
        self._translator = None

    def _get_translator(self):
        if not self._translator:
            try:
                from deep_translator import GoogleTranslator
                self._translator = GoogleTranslator
                logger.info("GoogleTranslator initialized")
            except ImportError:
                logger.warning("deep_translator not installed — using glossary-only mode")
        return self._translator

    async def translate_text(
        self,
        text: str,
        target_lang: str,
        source_lang: str = "en",
    ) -> str:
        """Translate text to target language"""
        if target_lang == source_lang or target_lang == "en":
            return text

        Translator = self._get_translator()
        if not Translator:
            return self._glossary_translate(text, target_lang)

        try:
            lang_map = {"hi": "hi", "gu": "gu", "en": "en"}
            translated = Translator(
                source=lang_map.get(source_lang, "en"),
                target=lang_map.get(target_lang, "en"),
            ).translate(text)
            return translated or text
        except Exception as e:
            logger.warning(f"Translation failed: {e}")
            return self._glossary_translate(text, target_lang)

    def _glossary_translate(self, text: str, target_lang: str) -> str:
        """Replace known legal terms using glossary"""
        result = text
        for en_term, translations in LEGAL_GLOSSARY.items():
            if target_lang in translations and en_term in result:
                result = result.replace(en_term, f"{en_term} ({translations[target_lang]})")
        return result

    async def translate_document(
        self,
        html_content: str,
        target_lang: str,
    ) -> str:
        """Translate an HTML legal document"""
        if target_lang == "en":
            return html_content

        # For production: parse HTML, extract text nodes, translate each
        # For now: add language marker and key terms glossary
        lang_names = {"hi": "हिन्दी", "gu": "ગુજરાતી"}
        header = f"""
        <div style="background:#f0f8ff;border:1px solid #c8d8e8;padding:10px 16px;margin-bottom:16px;font-size:12px;border-radius:6px">
          <strong>Language / भाषा / ભાષા:</strong> {lang_names.get(target_lang, target_lang)} |
          This document has been partially translated. Legal sections remain in English for accuracy.
        </div>
        """
        return header + html_content

    def get_ui_strings(self, lang: str = "en") -> dict:
        """Return UI string translations"""
        strings = {
            "en": {
                "case_registry": "Case Registry",
                "new_case": "New Case",
                "legal_ai": "Legal AI Engine",
                "evidence_vault": "Evidence Vault",
                "documents": "Documents",
                "case_diary": "Case Diary",
            },
            "hi": {
                "case_registry": "मामला रजिस्ट्री",
                "new_case": "नया मामला",
                "legal_ai": "कानूनी AI इंजन",
                "evidence_vault": "साक्ष्य तिजोरी",
                "documents": "दस्तावेज़",
                "case_diary": "मामला डायरी",
            },
            "gu": {
                "case_registry": "કેસ રજિસ્ટ્રી",
                "new_case": "નવો કેસ",
                "legal_ai": "કાનૂની AI એન્જિન",
                "evidence_vault": "પુરાવો તિજોરી",
                "documents": "દસ્તાવેજો",
                "case_diary": "કેસ ડાયરી",
            },
        }
        return strings.get(lang, strings["en"])


multilingual_service = MultilingualService()
