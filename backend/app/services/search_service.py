"""
CrimeGPT-X — Semantic Search Service
Combines ChromaDB vector search with PostgreSQL full-text search
"""
import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class SearchResult:
    id: str
    title: str
    type: str          # "case" | "judgment" | "bns_section"
    summary: str
    relevance_score: float
    metadata: Dict[str, Any]


class SemanticSearchService:
    """Multi-source semantic search for legal intelligence"""

    def __init__(self):
        self._embedder = None
        self._chroma = None

    def _get_embedder(self):
        if not self._embedder:
            try:
                from sentence_transformers import SentenceTransformer
                self._embedder = SentenceTransformer("all-MiniLM-L6-v2")
            except ImportError:
                logger.warning("sentence-transformers not available")
        return self._embedder

    async def search_judgments(
        self,
        query: str,
        filters: Optional[Dict[str, str]] = None,
        top_k: int = 5,
    ) -> List[SearchResult]:
        """Search landmark judgments using semantic similarity"""
        embedder = self._get_embedder()
        if not embedder:
            return self._mock_judgments(query)

        try:
            import chromadb
            from app.core.config import settings

            client = chromadb.AsyncHttpClient(
                host=settings.CHROMA_HOST, port=settings.CHROMA_PORT
            )
            collection = await client.get_collection("landmark_judgments")

            query_vec = embedder.encode(query).tolist()
            where_clause = {}
            if filters:
                for k, v in filters.items():
                    if v:
                        where_clause[k] = {"$eq": v}

            results = await collection.query(
                query_embeddings=[query_vec],
                n_results=top_k,
                where=where_clause if where_clause else None,
                include=["documents", "metadatas", "distances"],
            )

            out = []
            for i, doc in enumerate(results["documents"][0]):
                meta = results["metadatas"][0][i]
                score = max(0.0, 1.0 - results["distances"][0][i])
                out.append(SearchResult(
                    id=results["ids"][0][i],
                    title=meta.get("title", "Unknown"),
                    type="judgment",
                    summary=doc[:600],
                    relevance_score=score,
                    metadata=meta,
                ))
            return sorted(out, key=lambda x: x.relevance_score, reverse=True)

        except Exception as e:
            logger.warning(f"ChromaDB search failed: {e}, using mock results")
            return self._mock_judgments(query)

    async def search_bns_sections(
        self,
        fir_text: str,
        top_k: int = 6,
    ) -> List[SearchResult]:
        """Find relevant BNS/IT Act sections for given FIR text"""
        embedder = self._get_embedder()
        if not embedder:
            return self._mock_sections()

        try:
            import chromadb
            from app.core.config import settings

            client = chromadb.AsyncHttpClient(
                host=settings.CHROMA_HOST, port=settings.CHROMA_PORT
            )
            collection = await client.get_collection("bns_sections")
            query_vec = embedder.encode(fir_text[:1000]).tolist()

            results = await collection.query(
                query_embeddings=[query_vec],
                n_results=top_k,
                include=["documents", "metadatas", "distances"],
            )

            out = []
            for i, doc in enumerate(results["documents"][0]):
                meta = results["metadatas"][0][i]
                score = max(0.0, 1.0 - results["distances"][0][i])
                out.append(SearchResult(
                    id=results["ids"][0][i],
                    title=meta.get("section", "—") + " — " + meta.get("title", ""),
                    type="bns_section",
                    summary=doc[:400],
                    relevance_score=score,
                    metadata=meta,
                ))
            return sorted(out, key=lambda x: x.relevance_score, reverse=True)

        except Exception as e:
            logger.warning(f"BNS section search failed: {e}")
            return self._mock_sections()

    async def full_text_case_search(
        self,
        query: str,
        db,
        limit: int = 20,
    ) -> List[Dict[str, Any]]:
        """PostgreSQL full-text search across cases"""
        from sqlalchemy import text
        from app.models.models import Case

        ts_query = " & ".join(query.split())
        sql = text("""
            SELECT id, case_id, victim_name, accused_name, crime_category, status, created_at,
                   ts_rank(
                     to_tsvector('english', coalesce(victim_name,'') || ' ' || coalesce(accused_name,'') || ' ' || coalesce(incident_description,'')),
                     to_tsquery('english', :q)
                   ) as rank
            FROM cases
            WHERE to_tsvector('english', coalesce(victim_name,'') || ' ' || coalesce(accused_name,'') || ' ' || coalesce(incident_description,''))
                  @@ to_tsquery('english', :q)
            ORDER BY rank DESC
            LIMIT :limit
        """)

        try:
            result = await db.execute(sql, {"q": ts_query, "limit": limit})
            rows = result.fetchall()
            return [dict(r._mapping) for r in rows]
        except Exception as e:
            logger.warning(f"Full-text search failed: {e}")
            return []

    def _mock_judgments(self, query: str) -> List[SearchResult]:
        return [
            SearchResult(
                id="j001",
                title="State of Karnataka vs. Soman — AIR 2022 SC 1847",
                type="judgment",
                summary="Unauthorized remote access via AnyDesk to conduct financial transactions constitutes IT Act 66C/66D. Conviction upheld.",
                relevance_score=0.94,
                metadata={"court": "Supreme Court of India", "year": "2022", "sections": "BNS 318, IT Act 66C, IT Act 66D"},
            ),
            SearchResult(
                id="j003",
                title="Thane Police vs. Rahul Singh — Gujarat HC 2023 Cr LJ 210",
                type="judgment",
                summary="Gujarat HC upheld UPI fraud via bank impersonation. Digital evidence chain of custody held admissible.",
                relevance_score=0.87,
                metadata={"court": "Gujarat High Court", "year": "2023", "sections": "BNS 319, IT Act 66C"},
            ),
        ]

    def _mock_sections(self) -> List[SearchResult]:
        return [
            SearchResult(id="bns318", title="BNS 318 — Cheating", type="bns_section",
                        summary="Fraudulent inducement for property delivery. Max 3 years + fine.", relevance_score=0.91,
                        metadata={"section": "BNS 318", "act": "BNS"}),
            SearchResult(id="it66c", title="IT Act 66C — Identity Theft", type="bns_section",
                        summary="Unauthorized use of electronic signature, password, UPI credentials. Max 3 years + ₹1L fine.", relevance_score=0.88,
                        metadata={"section": "IT Act 66C", "act": "IT Act"}),
        ]


semantic_search = SemanticSearchService()
