"""
OCR Service — FIR Document Processing
Multi-language OCR using EasyOCR (primary) and Tesseract (fallback)
Extracts structured fields from FIR documents
"""
import asyncio
import re
import logging
from typing import Dict, Any, Optional, List
from pathlib import Path
import tempfile

logger = logging.getLogger(__name__)


class OCRService:
    """Multi-language OCR for FIR documents"""

    LANGUAGES = ["en", "hi", "gu"]

    # Regex patterns for field extraction
    PATTERNS = {
        "fir_number": [
            r"F\.?I\.?R\.?\s*No\.?\s*[:\-]?\s*([\w\/\-]+)",
            r"First Information Report\s*No\.?\s*([\w\/\-]+)",
            r"FIR\s*Number\s*[:\-]?\s*([\w\/\-]+)",
        ],
        "date": [
            r"Date\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})",
            r"Dated\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})",
            r"(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})",
        ],
        "complainant_name": [
            r"(?:Complainant|Victim|Name of Complainant)\s*[:\-]?\s*([A-Z][a-z]+(?: [A-Z][a-z]+){1,4})",
            r"(?:शिकायतकर्ता|पीड़ित)\s*[:\-]?\s*(.+?)(?:\n|Father|S\/o|D\/o)",
        ],
        "phone": [
            r"(?:Mobile|Phone|Contact|Tel)\s*[:\-]?\s*(\+?91?[-\s]?\d{10})",
            r"\b(\d{10})\b",
        ],
        "address": [
            r"(?:Address|Residence|Residing at)\s*[:\-]?\s*(.{20,150}?)(?:\n|State|Pin|City)",
        ],
        "amount": [
            r"(?:Rs\.?|₹|INR|Amount)\s*[\.\:]*\s*([\d,]+(?:\.\d{2})?)",
            r"([\d,]+)\s*(?:rupees|Rs|₹)",
        ],
        "accused_name": [
            r"(?:Accused|Suspect|Name of Accused)\s*[:\-]?\s*([A-Z][a-z]+(?: [A-Z][a-z]+){1,4})",
        ],
        "police_station": [
            r"(?:Police Station|P\.S\.|PS)\s*[:\-]?\s*(.{5,80}?)(?:\n|District|City)",
        ],
    }

    def __init__(self):
        self._easyocr_reader = None
        self._pytesseract = None

    def _get_reader(self):
        if not self._easyocr_reader:
            try:
                import easyocr
                self._easyocr_reader = easyocr.Reader(self.LANGUAGES, gpu=False)
                logger.info("EasyOCR reader initialized")
            except Exception as e:
                logger.warning(f"EasyOCR not available: {e}")
        return self._easyocr_reader

    async def process_file(
        self,
        file_path: str,
        mime_type: str
    ) -> Dict[str, Any]:
        """Main entry point: process uploaded FIR file"""
        result = {
            "raw_text": "",
            "extracted_fields": {},
            "confidence": 0.0,
            "ocr_engine": "none",
            "pages": 0,
        }

        try:
            if "pdf" in mime_type:
                text, pages = await self._process_pdf(file_path)
            else:
                text, pages = await self._process_image(file_path)

            result["raw_text"] = text
            result["pages"] = pages
            result["extracted_fields"] = self._extract_fields(text)
            result["confidence"] = self._calculate_confidence(result["extracted_fields"])
            result["ocr_engine"] = "easyocr"

        except Exception as e:
            logger.error(f"OCR processing failed: {e}")
            result["error"] = str(e)

        return result

    async def _process_pdf(self, file_path: str):
        """Convert PDF to images then OCR each page"""
        try:
            from pdf2image import convert_from_path
            # convert_from_path and OCR are both CPU/IO-heavy blocking calls —
            # run off the event loop so one OCR job doesn't freeze every other
            # concurrent request on this worker.
            images = await asyncio.to_thread(convert_from_path, file_path, dpi=300)
            all_text = []
            for img in images:
                with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                    await asyncio.to_thread(img.save, tmp.name, "PNG")
                    text, _ = await self._process_image(tmp.name)
                    all_text.append(text)
                    Path(tmp.name).unlink(missing_ok=True)
            return "\n\n--- PAGE BREAK ---\n\n".join(all_text), len(images)
        except ImportError:
            return await self._tesseract_pdf(file_path)

    async def _process_image(self, file_path: str):
        """OCR a single image file"""
        reader = await asyncio.to_thread(self._get_reader)
        if reader:
            results = await asyncio.to_thread(reader.readtext, file_path, detail=1, paragraph=True)
            text = "\n".join([r[1] for r in results if r[2] > 0.3])
            return text, 1
        else:
            return await self._tesseract_image(file_path)

    async def _tesseract_image(self, file_path: str):
        try:
            import pytesseract
            from PIL import Image
            text = await asyncio.to_thread(
                pytesseract.image_to_string,
                Image.open(file_path),
                lang="eng+hin+guj",
                config="--psm 6",
            )
            return text, 1
        except Exception as e:
            logger.error(f"Tesseract failed: {e}")
            return "", 1

    async def _tesseract_pdf(self, file_path: str):
        return "", 0

    def _extract_fields(self, text: str) -> Dict[str, str]:
        """Extract structured fields from OCR text using regex patterns"""
        fields = {}
        for field_name, patterns in self.PATTERNS.items():
            for pattern in patterns:
                match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
                if match:
                    value = match.group(1).strip()
                    if len(value) > 1:
                        fields[field_name] = value
                        break

        # Post-process amount
        if "amount" in fields:
            raw = fields["amount"].replace(",", "").replace(" ", "")
            try:
                fields["amount"] = str(float(raw))
            except ValueError:
                pass

        return fields

    def _calculate_confidence(self, fields: Dict[str, str]) -> float:
        """Calculate extraction confidence based on fields found"""
        key_fields = ["fir_number", "date", "complainant_name", "phone", "amount"]
        found = sum(1 for f in key_fields if f in fields)
        return round((found / len(key_fields)) * 100, 1)


ocr_service = OCRService()
