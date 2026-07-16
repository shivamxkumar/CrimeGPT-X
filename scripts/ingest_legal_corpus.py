"""
CrimeGPT-X — Legal Judgments Ingestion Pipeline
Ingests a REAL corpus of Indian judgments into ChromaDB for RAG retrieval.

This script never inserts sample/demo/fabricated judgments. Until you run it
with a real corpus file, the `landmark_judgments` collection stays empty and
the application reports:
  "No indexed judgments available. Please ingest a real legal corpus."

Usage:
  python scripts/ingest_legal_corpus.py path/to/judgments.json
  python scripts/ingest_legal_corpus.py            # creates an empty collection only

Input file format — a JSON array of real judgments:
[
  {
    "id": "optional-stable-id",
    "title": "Case Name vs. Other Party",
    "citation": "AIR 2022 SC 1847",
    "court": "Supreme Court of India",
    "year": "2022",
    "text": "Full judgment text or a substantive verified summary",
    "relevance": "One-line note on why this precedent matters",
    "sections": ["BNS 318", "IT Act 66C"]
  },
  ...
]

Each entry is embedded with sentence-transformers (all-MiniLM-L6-v2) and
upserted into the ChromaDB `landmark_judgments` collection, keyed by `id`
(auto-generated from title+citation if omitted) so re-running the script
with an updated corpus updates existing entries instead of duplicating them.
"""
import argparse
import hashlib
import json
import sys
from pathlib import Path

import chromadb

CHROMA_HOST = "localhost"
CHROMA_PORT = 8001
COLLECTION_NAME = "landmark_judgments"

REQUIRED_FIELDS = {"title", "court", "year", "text"}


def _stable_id(entry: dict) -> str:
    key = f"{entry.get('title', '')}|{entry.get('citation', '')}"
    return hashlib.sha1(key.encode("utf-8")).hexdigest()[:16]


def load_corpus(path: str) -> list[dict]:
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError("Corpus file must contain a JSON array of judgment objects")

    for i, entry in enumerate(data):
        missing = REQUIRED_FIELDS - entry.keys()
        if missing:
            raise ValueError(f"Entry {i} is missing required field(s): {missing}")
    return data


def ingest(corpus_path: str | None):
    print("Connecting to ChromaDB...")
    client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)

    collection = client.get_or_create_collection(
        COLLECTION_NAME, metadata={"hnsw:space": "cosine"}
    )

    if not corpus_path:
        print(f"No corpus file given — ensured empty '{COLLECTION_NAME}' collection exists.")
        print("The app will show: \"No indexed judgments available. Please ingest a real legal corpus.\"")
        print(f"Current document count: {collection.count()}")
        return

    print(f"Loading real judgments corpus from {corpus_path}...")
    entries = load_corpus(corpus_path)
    if not entries:
        print("Corpus file is empty — nothing to ingest.")
        return

    print("Loading sentence-transformer embedder (all-MiniLM-L6-v2)...")
    from sentence_transformers import SentenceTransformer
    embedder = SentenceTransformer("all-MiniLM-L6-v2")

    docs, metas, ids = [], [], []
    for entry in entries:
        docs.append(entry["text"].strip())
        metas.append({
            "title": entry["title"],
            "citation": entry.get("citation", ""),
            "court": entry["court"],
            "year": str(entry["year"]),
            "relevance": entry.get("relevance", ""),
            "sections": ", ".join(entry.get("sections", [])),
        })
        ids.append(entry.get("id") or _stable_id(entry))

    embeddings = embedder.encode(docs).tolist()
    collection.upsert(documents=docs, metadatas=metas, ids=ids, embeddings=embeddings)

    print(f"Ingested {len(docs)} real judgment(s).")
    print(f"Collection '{COLLECTION_NAME}' now has {collection.count()} document(s).")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("corpus_path", nargs="?", default=None, help="Path to a JSON file of real judgments")
    args = parser.parse_args()

    try:
        ingest(args.corpus_path)
    except Exception as e:
        print(f"Ingestion failed: {e}", file=sys.stderr)
        sys.exit(1)
