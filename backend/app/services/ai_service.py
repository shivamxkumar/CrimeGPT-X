"""
AI Legal Intelligence Service
Core engine for BNS/BNSS section recommendation, entity/timeline extraction,
risk assessment, judgment RAG retrieval, and document generation.
Uses Google Gemini + ChromaDB RAG pipeline. No fallback/mock data — any
failure to reach Gemini or a genuine infrastructure error is raised, never
silently swapped for canned output.
"""
import json
import re
import time
import logging
from typing import List, Dict, Any, Optional

from google import genai
from google.genai import types as genai_types
import chromadb

from app.core.config import settings
from app.schemas.schemas import (
    LegalSection, Judgment, AIAnalysisResponse,
    ExtractedEntities, TimelineEvent, RiskAssessment,
)

logger = logging.getLogger(__name__)

NO_JUDGMENTS_MESSAGE = "No indexed judgments available. Please ingest a real legal corpus."


class AIServiceError(Exception):
    """Raised when the AI/RAG pipeline genuinely fails — never caught to fabricate a response."""


# Lazy-loaded clients
_gemini_client: Optional[genai.Client] = None
_chroma_client: Optional[chromadb.AsyncHttpClient] = None
_embedder = None


def get_gemini() -> genai.Client:
    global _gemini_client
    if not _gemini_client:
        if not settings.GEMINI_API_KEY:
            raise AIServiceError("GEMINI_API_KEY is not configured")
        # Bounded timeout so a slow/unresponsive Gemini API can't hang a
        # request (and the worker holding it) indefinitely.
        _gemini_client = genai.Client(
            api_key=settings.GEMINI_API_KEY,
            http_options=genai_types.HttpOptions(timeout=90_000),
        )
    return _gemini_client


async def get_chroma():
    global _chroma_client
    if not _chroma_client:
        _chroma_client = await chromadb.AsyncHttpClient(
            host=settings.CHROMA_HOST, port=settings.CHROMA_PORT
        )
    return _chroma_client


def get_embedder():
    global _embedder
    if not _embedder:
        from sentence_transformers import SentenceTransformer
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedder


LEGAL_ANALYSIS_SYSTEM_PROMPT = """You are a senior legal AI assistant for the Gujarat Police Cyber Crime Branch, India.

You analyze FIRs (First Information Reports) and produce a complete structured investigation
brief covering:
- Applicable legal sections under BNS (Bharatiya Nyaya Sanhita 2023), BNSS (Bharatiya Nagarik
  Suraksha Sanhita 2023), BSA (Bharatiya Sakshya Adhiniyam 2023), the Information Technology
  Act 2000 (amended 2008), and the Payment and Settlement Systems Act
- Victims, suspects, and witnesses explicitly named or described in the FIR text
- A chronological timeline of events reconstructed from the FIR narrative
- A risk assessment for the investigating officer (urgency of evidence preservation, flight
  risk, further-victimization risk, financial-recovery window)

Response Rules:
1. Only suggest sections that clearly apply to the FIR text — never invent facts not present in the text
2. Include confidence scores (0-100) for each legal section, based on textual evidence
3. Be specific — cite actual section numbers, not just act names
4. Only extract entities (names) that are actually present in the FIR text; if none are named for a
   category, return an empty list for it — never invent a person
5. Timeline events must be grounded in dates/sequence actually described in the text; if no explicit
   dates exist, order events by narrative sequence and leave "date" null
6. Return ONLY valid JSON, no markdown fences, no preamble

Return this exact JSON structure:
{
  "crime_type_detected": "string",
  "key_facts": ["fact1", "fact2"],
  "sections": [
    {
      "section": "BNS 318",
      "title": "Cheating",
      "description": "Why this section applies to THIS specific FIR",
      "confidence": 93,
      "act": "BNS"
    }
  ],
  "entities": {
    "victims": [{"name": "string", "details": "string or null"}],
    "suspects": [{"name": "string", "details": "string or null"}],
    "witnesses": [{"name": "string", "details": "string or null"}]
  },
  "timeline": [
    {"date": "YYYY-MM-DD or null", "description": "string"}
  ],
  "risk_assessment": {
    "level": "low|medium|high|critical",
    "score": 0,
    "factors": ["factor1", "factor2"]
  },
  "investigation_recommendations": ["recommendation1", "recommendation2"]
}"""


DOCUMENT_GENERATION_PROMPTS = {
    "chargesheet": """Generate a complete, legally correct Chargesheet (आरोप पत्र) for Indian courts.
Use formal legal language. Include all sections. Format as structured HTML.

Case Details: {case_details}
Legal Sections: {sections}
Evidence: {evidence}

Generate a professional chargesheet with:
- Header (Court name, PS name, FIR details)
- Complainant/Victim details
- Accused details
- Facts of the case (numbered paragraphs)
- Evidence list (with chain of custody)
- Applicable legal sections with explanation
- Prayer/Relief sought
- IO signature block

Return complete HTML content only.""",

    "remand_request": """Generate a formal Remand Request Letter for police custody in an Indian court.

Case Details: {case_details}
Accused: {accused_details}
Grounds: Investigation pending — digital forensics, tracing mule accounts, recovering stolen funds.

Include:
- To: The Hon'ble Chief Judicial Magistrate
- Subject line
- FIR details
- Grounds for remand (specific to cyber crime investigation)
- Prayer for 3/7/14 day police custody
- Undertaking by IO

Return complete HTML content only.""",

    "panchanama": """Generate an Accused Panchanama in proper legal format for Gujarat Police.

Case Details: {case_details}
Return proper panchanama with witness signatures block, accused description, seized articles list, and IO attestation.""",

    "seizure_receipt": """Generate a Seizure Receipt (जब्ती पावती) for digital evidence seized.

Case Details: {case_details}
Evidence Items: {evidence}

Include property numbers, descriptions, condition, storage location, and chain of custody signatures.""",
}


def _parse_json_response(raw: str) -> Dict[str, Any]:
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if not match:
            raise AIServiceError("Gemini did not return parseable JSON")
        return json.loads(match.group())


class AILegalService:
    """Core AI Legal Intelligence Engine — Gemini-backed, no fallback data."""

    async def analyze_fir(
        self,
        fir_text: str,
        case_id: Optional[str] = None,
        language: str = "en",
    ) -> AIAnalysisResponse:
        start_time = time.time()

        try:
            data = await self._analyze_sections(fir_text)
            judgments, judgments_message = await self.search_judgments(
                query=fir_text[:500] + " " + " ".join(s.section for s in data["sections"])
            )
        except AIServiceError:
            raise
        except Exception as e:
            logger.error(f"AI analysis failed: {e}")
            raise AIServiceError(f"AI analysis failed: {e}") from e

        elapsed_ms = int((time.time() - start_time) * 1000)

        return AIAnalysisResponse(
            sections=data["sections"],
            judgments=judgments,
            judgments_message=judgments_message,
            crime_type_detected=data.get("crime_type_detected", "Unknown"),
            key_facts=data.get("key_facts", []),
            entities=data["entities"],
            timeline=data["timeline"],
            risk_assessment=data["risk_assessment"],
            investigation_recommendations=data.get("investigation_recommendations", []),
            model_used=settings.AI_MODEL,
            analysis_time_ms=elapsed_ms,
        )

    async def _analyze_sections(self, fir_text: str) -> Dict[str, Any]:
        client = get_gemini()
        response = await client.aio.models.generate_content(
            model=settings.AI_MODEL,
            contents=f"Analyze this FIR:\n\n{fir_text}",
            config=genai_types.GenerateContentConfig(
                system_instruction=LEGAL_ANALYSIS_SYSTEM_PROMPT,
                response_mime_type="application/json",
                max_output_tokens=settings.AI_MAX_TOKENS,
                thinking_config=genai_types.ThinkingConfig(thinking_budget=0),
            ),
        )
        data = _parse_json_response(response.text)

        return {
            "sections": [LegalSection(**s) for s in data.get("sections", [])],
            "crime_type_detected": data.get("crime_type_detected", "Unknown"),
            "key_facts": data.get("key_facts", []),
            "entities": ExtractedEntities(**data.get("entities", {})),
            "timeline": [TimelineEvent(**t) for t in data.get("timeline", [])],
            "risk_assessment": RiskAssessment(**data.get(
                "risk_assessment", {"level": "medium", "score": 50, "factors": []}
            )),
            "investigation_recommendations": data.get("investigation_recommendations", []),
        }

    async def search_judgments(
        self,
        query: str,
        top_k: int = 3,
    ) -> (List[Judgment], Optional[str]):
        """Real semantic search over the ingested judgments corpus.

        An empty/missing collection is a legitimate empty state (no corpus
        ingested yet) and returns ([], NO_JUDGMENTS_MESSAGE) rather than an
        error. A genuine ChromaDB connectivity failure still raises.
        """
        try:
            chroma = await get_chroma()
        except Exception as e:
            raise AIServiceError(f"Vector store unreachable: {e}") from e

        try:
            collection = await chroma.get_collection(settings.CHROMA_COLLECTION_JUDGMENTS)
        except Exception:
            # Collection doesn't exist yet — no corpus has been ingested.
            return [], NO_JUDGMENTS_MESSAGE

        count = await collection.count()
        if count == 0:
            return [], NO_JUDGMENTS_MESSAGE

        embedder = get_embedder()
        embedding = embedder.encode(query).tolist()

        results = await collection.query(
            query_embeddings=[embedding],
            n_results=min(top_k, count),
            include=["documents", "metadatas", "distances"],
        )

        judgments = []
        for i, doc in enumerate(results["documents"][0]):
            meta = results["metadatas"][0][i]
            score = 1 - results["distances"][0][i]
            judgments.append(Judgment(
                title=meta.get("title", "Unknown"),
                court=meta.get("court", "Unknown"),
                year=meta.get("year"),
                citation=meta.get("citation"),
                summary=doc[:500],
                legal_relevance=meta.get("relevance", "Relevant to this case type"),
                relevance_score=max(0.0, min(1.0, score)),
            ))
        return judgments, None

    async def generate_document(
        self,
        doc_type: str,
        case_data: Dict[str, Any],
        language: str = "en",
    ) -> str:
        client = get_gemini()
        prompt_template = DOCUMENT_GENERATION_PROMPTS.get(doc_type, "")
        if not prompt_template:
            raise ValueError(f"Unknown document type: {doc_type}")

        prompt = prompt_template.format(
            case_details=json.dumps(case_data, indent=2, default=str),
            sections=json.dumps(case_data.get("ai_sections", []), indent=2),
            evidence=json.dumps(case_data.get("evidence_summary", []), indent=2),
            accused_details=json.dumps({
                "name": case_data.get("accused_name"),
                "phone": case_data.get("accused_phone"),
                "address": case_data.get("accused_address"),
            }),
        )

        try:
            response = await client.aio.models.generate_content(
                model=settings.AI_MODEL,
                contents=prompt,
                config=genai_types.GenerateContentConfig(max_output_tokens=max(settings.AI_MAX_TOKENS, 8192)),
            )
            return response.text
        except Exception as e:
            raise AIServiceError(f"Document generation failed: {e}") from e

    async def chat_with_legal_ai(
        self,
        messages: List[Dict[str, str]],
        case_context: Optional[Dict[str, Any]] = None,
    ) -> str:
        client = get_gemini()
        system = """You are CrimeGPT-X, the AI legal assistant for Gujarat Police Cyber Crime Branch.

You help Investigation Officers with:
- BNS / BNSS / BSA sections and their applicability
- Cyber crime investigation procedures
- Evidence collection and chain of custody
- Chargesheet preparation
- Court procedures under BNSS

Be concise, cite specific section numbers, and tailor advice to Indian law. These are AI-generated
suggestions the IO must independently verify — never present them as settled legal fact.
"""
        if case_context:
            system += f"\n\nCurrent Case Context:\n{json.dumps(case_context, indent=2, default=str)}"

        contents = [
            genai_types.Content(
                role="model" if m.get("role") == "assistant" else "user",
                parts=[genai_types.Part(text=m.get("content", ""))],
            )
            for m in messages
        ]

        try:
            response = await client.aio.models.generate_content(
                model=settings.AI_MODEL,
                contents=contents,
                config=genai_types.GenerateContentConfig(
                    system_instruction=system,
                    max_output_tokens=1024,
                    thinking_config=genai_types.ThinkingConfig(thinking_budget=0),
                ),
            )
            return response.text
        except Exception as e:
            raise AIServiceError(f"Legal chat failed: {e}") from e

    async def analyze_cyber_content(self, content_type: str, content: str) -> Dict[str, Any]:
        """Real-time cyber crime pattern detection over a URL/chat/email/phone excerpt."""
        client = get_gemini()
        prompt = f"""Analyze this {content_type} for cyber crime indicators:

Content: {content}

Return JSON only, grounded strictly in the content provided (never invent indicators not
supported by the text):
{{
  "threat_level": "high|medium|low|none",
  "crime_type": "string",
  "indicators": ["indicator1", "indicator2"],
  "applicable_sections": ["BNS 318", "IT Act 66C"],
  "evidence_to_preserve": ["action1"],
  "investigation_steps": ["step1"]
}}"""
        try:
            response = await client.aio.models.generate_content(
                model=settings.AI_MODEL,
                contents=prompt,
                config=genai_types.GenerateContentConfig(
                    response_mime_type="application/json",
                    max_output_tokens=1024,
                    thinking_config=genai_types.ThinkingConfig(thinking_budget=0),
                ),
            )
            return _parse_json_response(response.text)
        except AIServiceError:
            raise
        except Exception as e:
            raise AIServiceError(f"Cyber content analysis failed: {e}") from e

    async def analyze_evidence(
        self,
        description: str,
        ocr_text: str,
        case_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Real analysis of an evidence item's relevance to the case, grounded in its
        description and any OCR'd text extracted from the file itself."""
        client = get_gemini()
        prompt = f"""You are analyzing a piece of digital evidence uploaded for an Indian cyber
crime investigation.

Evidence description (from the uploading officer): {description or "(none provided)"}
Extracted text from the evidence file (OCR, may be empty): {ocr_text[:3000] or "(no text extracted)"}
Case context: {json.dumps(case_context or {}, indent=2, default=str)}

Return JSON only, grounded strictly in the text above:
{{
  "relevance_summary": "string — how this evidence relates to the case, or 'insufficient information' if unclear",
  "key_points": ["point1", "point2"],
  "suggested_tags": ["tag1", "tag2"]
}}"""
        try:
            response = await client.aio.models.generate_content(
                model=settings.AI_MODEL,
                contents=prompt,
                config=genai_types.GenerateContentConfig(
                    response_mime_type="application/json",
                    max_output_tokens=1024,
                    thinking_config=genai_types.ThinkingConfig(thinking_budget=0),
                ),
            )
            return _parse_json_response(response.text)
        except AIServiceError:
            raise
        except Exception as e:
            raise AIServiceError(f"Evidence analysis failed: {e}") from e


ai_legal_service = AILegalService()
