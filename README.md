# 🔍 CrimeGPT-X — AI-Powered Crime Documentation & Legal Intelligence Platform

> **"From FIR to Arrest — One Intelligent Investigation Platform"**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Architecture](#architecture)
4. [Technology Stack](#technology-stack)
5. [Local Development](#local-development)
6. [Environment Variables](#environment-variables)
7. [Ingesting a Real Judgments Corpus](#ingesting-a-real-judgments-corpus)
8. [API Documentation](#api-documentation)
9. [Production Deployment](#production-deployment)
10. [Security](#security)
11. [Project Structure](#project-structure)

---

## Overview

CrimeGPT-X is a full-stack AI-powered police investigation platform that eliminates
repetitive data entry and automates legal documentation for cyber crime cases.
Officers enter case data **once** — CrimeGPT-X uses Google Gemini to suggest
applicable BNS/BNSS/IT Act sections, extract victims/suspects/witnesses and a
case timeline from FIR text, assess investigation risk, retrieve indexed
landmark judgments via RAG, generate legal documents, and maintain a
timestamped investigation diary — all backed by real OCR, a real Postgres
database, and real object storage.

**No mock data, no fallback responses, no fabricated AI output.** Every
feature calls real backend logic. If an external dependency (Gemini,
ChromaDB, MinIO) is unavailable, the API returns a real error — it never
silently substitutes canned content.

---

## Key Features

| Feature | Technology | Notes |
|---------|-----------|-------|
| BNS/BNSS/IT Act Section Recommendation | Google Gemini | Live per-FIR inference, not a lookup table |
| Entity Extraction (victims/suspects/witnesses) | Google Gemini | Extracted only from text actually present in the FIR |
| Timeline Generation | Google Gemini | Chronological reconstruction from the FIR narrative |
| Risk Assessment | Google Gemini | Investigation urgency/risk scoring with factors |
| FIR OCR Extraction | EasyOCR + Tesseract | Real multi-language OCR (EN/HI/GU) |
| Landmark Judgment RAG Search | ChromaDB + Sentence Transformers | Returns real indexed judgments, or a clear empty-state message if none are ingested yet — never fabricated |
| Legal AI Chat / Question Answering | Google Gemini | Case-context-aware conversational assistant |
| Cyber Threat Detection | Google Gemini | URL/message/email/phone pattern analysis |
| Evidence Relevance Analysis | Google Gemini + OCR | Grounded in the evidence file's own extracted text |
| SHA-256 Evidence Integrity | Python hashlib | Real hash on every upload |
| Chain of Custody Tracking | PostgreSQL JSONB | Immutable per-evidence custody log |
| Auto Document Generation | Jinja2 + Gemini fallback | Real case + evidence data populate every template |
| PDF / DOCX Export | WeasyPrint + python-docx | Renders the document's actual generated content |
| Role-Based Access Control | JWT + FastAPI | 4 roles: IO, SHO, Legal, Admin |
| Immutable Audit Trail | PostgreSQL + Middleware | Every write action logged with IP/user/timestamp |
| Case Diary Automation | Auto on every action | Real diary entries, not scripted demo text |
| Scheduled Deadline Alerts | Celery Beat | Real query against court-submission deadlines every 6h |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  Next.js 14 (TypeScript) · TailwindCSS · Recharts · Zustand    │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / JWT
┌────────────────────────────▼────────────────────────────────────┐
│                     NGINX REVERSE PROXY                          │
│  SSL Termination · Rate Limiting · CORS · Load Balancing        │
└──────────┬─────────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────────┐
│                    FASTAPI BACKEND                                │
│  /auth  /cases  /fir  /ai  /documents  /evidence  /analytics   │
│  JWT RBAC · Audit Middleware · Async SQLAlchemy                 │
├────────┬─────────────┬─────────────┬───────────────────────────┤
│ AI     │ OCR         │ Evidence    │ Celery Workers             │
│ Engine │ Service     │ Service     │ (Async Tasks + Beat)       │
│ Gemini │ EasyOCR     │ MinIO+SHA256│ AI Jobs · Notifications   │
└────┬───┴──────┬──────┴─────┬───────┴───────────────────────────┘
     │          │             │
┌────▼──┐ ┌───▼──────┐ ┌────▼──────┐ ┌──────────┐ ┌──────────┐
│Gemini │ │ ChromaDB │ │PostgreSQL │ │  MinIO   │ │  Redis   │
│  API  │ │ Vectors  │ │  +pg_trgm │ │ Evidence │ │  Cache   │
│       │ │Judgments │ │  Cases DB │ │  Store   │ │  Queue   │
└───────┘ └──────────┘ └───────────┘ └──────────┘ └──────────┘
```

---

## Technology Stack

### Frontend
| Component | Technology |
|-----------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS |
| State / Data | Zustand + React Query |
| Charts | Recharts |
| File Upload | React Dropzone |
| Notifications | React Hot Toast |

### Backend
| Component | Technology |
|-----------|-----------|
| Framework | FastAPI (Python 3.12) |
| ORM | SQLAlchemy 2.0 (Async) |
| Database | PostgreSQL 16 + pg_trgm |
| Migrations | Alembic |
| Auth | JWT + bcrypt (passlib) |
| Task Queue | Celery + Redis + Celery Beat |
| Validation | Pydantic v2 |

### AI / ML
| Component | Technology |
|-----------|-----------|
| LLM | Google Gemini (`google-genai` SDK) |
| RAG | ChromaDB + sentence-transformers (all-MiniLM-L6-v2) |
| OCR Primary | EasyOCR (English + Hindi + Gujarati) |
| OCR Fallback | Tesseract + pytesseract |
| PDF Export | WeasyPrint (real HTML → PDF) |
| DOCX Export | python-docx + BeautifulSoup (real HTML → DOCX) |

### Infrastructure
| Component | Technology |
|-----------|-----------|
| Containerization | Docker + Docker Compose |
| Object Storage | MinIO (S3-compatible; swap for AWS S3/Cloudflare R2 in prod) |
| Cache / Broker | Redis 7 |
| Reverse Proxy | Nginx |
| Monitoring | Flower (Celery) + pgAdmin |

---

## Local Development

### Prerequisites
- Docker & Docker Compose v2+
- Node.js 20+ (frontend dev outside Docker)
- Python 3.12+ (backend dev outside Docker)
- A [Gemini API key](https://aistudio.google.com/apikey)

### 1. Clone & configure

```bash
git clone <your-fork-url>
cd crimegpt-x
cp .env.example .env
# Edit .env and set GEMINI_API_KEY (required) and JWT_SECRET_KEY/SECRET_KEY
```

### 2. Full stack via Docker Compose

```bash
docker compose up -d
docker compose logs -f backend

# Ensure the ChromaDB judgments collection exists (starts empty — see below)
docker compose exec backend python scripts/ingest_legal_corpus.py
```

| Service | URL |
|---------|-----|
| CrimeGPT-X App | http://localhost |
| Backend API docs | http://localhost:8000/api/docs |
| MinIO Console | http://localhost:9001 |
| pgAdmin (dev profile) | http://localhost:5050 |
| Flower (Celery) | http://localhost:5555 |

Initial accounts are seeded by `scripts/init_db.sql` (badge number / password
`demo1234` for each role) — rotate these passwords before any real
deployment.

### 3. Backend outside Docker

```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend outside Docker

```bash
cd frontend
npm install
npm run dev   # → http://localhost:3000
```

### 5. Run the test suite

```bash
cd backend
pip install -r tests/requirements-test.txt
pytest tests/ -v
```

---

## Environment Variables

See `.env.example` for the full list with comments. The required ones:

| Variable | Purpose |
|----------|---------|
| `GEMINI_API_KEY` | Google Gemini API key — every AI feature requires this |
| `AI_MODEL` | Gemini model id (default `gemini-3.5-flash`) |
| `DATABASE_URL` | Postgres connection string (`postgresql+asyncpg://...`) |
| `JWT_SECRET_KEY` / `SECRET_KEY` | Random secrets — generate with `openssl rand -hex 32` |
| `REDIS_URL` | Celery broker/result backend |
| `CHROMA_HOST` / `CHROMA_PORT` | ChromaDB for judgment RAG |
| `MINIO_ENDPOINT` / `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` | Evidence/document object storage |
| `UPLOAD_FOLDER`, `PORT` | Local temp-file path and backend listen port |
| `NEXT_PUBLIC_API_URL` | Frontend → backend base URL |

**Never commit `.env`.** It's already gitignored.

---

## Ingesting a Real Judgments Corpus

The landmark-judgment RAG search never contains sample or fabricated case
law. Until you ingest a real corpus, `GET /api/v1/ai/judgments/search` and
the judgment tab in the Legal AI Engine will show:

> "No indexed judgments available. Please ingest a real legal corpus."

To index real judgments, prepare a JSON file:

```json
[
  {
    "title": "Case Name vs. Other Party",
    "citation": "AIR 2022 SC 1847",
    "court": "Supreme Court of India",
    "year": "2022",
    "text": "Full judgment text or a substantive verified summary",
    "relevance": "Why this precedent matters",
    "sections": ["BNS 318", "IT Act 66C"]
  }
]
```

Then run:

```bash
docker compose exec backend python scripts/ingest_legal_corpus.py /path/to/judgments.json
# or locally:
python scripts/ingest_legal_corpus.py /path/to/judgments.json
```

Re-running the script with an updated file upserts existing entries by a
stable id derived from title+citation — it never duplicates.

---

## API Documentation

Interactive Swagger UI: `http://localhost:8000/api/docs`

### Core Endpoints

```
POST /api/v1/auth/login                       JWT login
POST /api/v1/auth/register                    Register new officer
GET  /api/v1/auth/me                          Current user

GET    /api/v1/cases                          List cases (filters)
POST   /api/v1/cases                          Create case
GET    /api/v1/cases/{case_id}                Case detail (accepts case_id or UUID)
PATCH  /api/v1/cases/{case_id}                Update case
GET    /api/v1/cases/stats/summary            Dashboard stats

POST /api/v1/fir/upload                       FIR upload → real OCR extraction

POST /api/v1/ai/analyze                       FIR text → sections/entities/timeline/risk (Gemini)
POST /api/v1/ai/chat                          Legal AI conversation (Gemini)
GET  /api/v1/ai/judgments/search              Real RAG judgment search
POST /api/v1/ai/cyber-analyze                 Cyber threat pattern detection (Gemini)

POST /api/v1/documents/generate               Generate legal document
GET  /api/v1/documents/by-case/{case_id}      List documents for a case
GET  /api/v1/documents/{doc_id}/export/pdf    Real PDF export
GET  /api/v1/documents/{doc_id}/export/docx   Real DOCX export

POST /api/v1/evidence/{case_id}/upload        Upload evidence (hash + AI relevance analysis)
GET  /api/v1/evidence/{case_id}                List evidence

GET  /api/v1/diary/{case_id}                  Case diary
GET  /api/v1/diary/recent                     Recent activity across visible cases

GET  /api/v1/analytics/overview               Summary stats
GET  /api/v1/analytics/crime-distribution     By category
GET  /api/v1/analytics/weekly-trend           Cases registered per day (7d)
GET  /api/v1/analytics/document-stats         Documents generated by type

GET  /api/v1/admin/system-status              Real infra health check (admin only)
```

---

## Production Deployment

### Frontend → Vercel

```bash
cd frontend
npm i -g vercel
vercel login
vercel link
vercel env add NEXT_PUBLIC_API_URL production   # https://<your-backend>.up.railway.app/api/v1
vercel --prod
```

`frontend/vercel.json` is preconfigured for the Next.js build.

### Backend + Postgres → Railway

```bash
npm i -g @railway/cli
railway login
railway init
railway add --database postgres
railway up   # deploys backend/ using backend/Dockerfile
```

Set these variables in the Railway service (Settings → Variables):
`GEMINI_API_KEY`, `JWT_SECRET_KEY`, `SECRET_KEY`, `ALLOWED_ORIGINS`
(include your Vercel URL), plus `REDIS_URL`/`CHROMA_HOST`/`MINIO_*` pointed
at managed equivalents (see below). Railway injects `DATABASE_URL` and
`PORT` automatically — the Dockerfile's `CMD` already binds `${PORT}`.

**Supporting services on Railway** (no managed plugins exist for these —
each needs its own Railway service from the public Docker image, or an
external managed alternative):
- **Redis**: deploy the `redis:7-alpine` image as a Railway service, or use Railway's Redis template.
- **ChromaDB**: deploy `chromadb/chroma:0.5.23` as a Railway service.
- **Object storage**: deploy `minio/minio` as a Railway service, **or** point
  `MINIO_ENDPOINT`/`MINIO_ACCESS_KEY`/`MINIO_SECRET_KEY` at a real
  S3-compatible provider (AWS S3, Cloudflare R2, Backblaze B2) — the `minio`
  Python client works against any S3-compatible endpoint.
- **Celery worker + beat**: deploy `backend/Dockerfile` again as two more
  Railway services with start commands
  `celery -A app.worker worker --loglevel=info -Q default,ai,documents,notifications`
  and `celery -A app.worker beat --loglevel=info`.

### Verify production builds locally before deploying

```bash
cd frontend && npm run build
cd backend && docker build -t crimegpt-backend .
```

---

## Security

- **JWT Authentication** — 8-hour tokens
- **Role-Based Access Control** — 4 tiers, endpoint-level enforcement
- **Immutable Audit Trail** — every write action logged with IP, user, timestamp
- **Evidence Integrity** — SHA-256 hash on upload; upload fails loudly (503) if
  object storage is unreachable rather than silently degrading to local disk
- **Input Validation** — Pydantic v2 for all API inputs
- **SQL Injection Prevention** — SQLAlchemy parameterized queries throughout
- **File Upload Security** — MIME type inference, size limits
- **Secrets** — never committed; `.env` is gitignored, `.env.example` has placeholders only
- **All AI calls happen server-side** — the Gemini API key never reaches the browser

---

## Project Structure

```
crimegpt-x/
├── backend/
│   ├── app/
│   │   ├── api/endpoints/       # auth, cases, fir, ai_analysis, documents, evidence, diary, analytics, admin, notifications
│   │   ├── core/                # config, database, auth, query_helpers
│   │   ├── models/               # SQLAlchemy models
│   │   ├── schemas/               # Pydantic schemas
│   │   ├── services/              # ai_service (Gemini), ocr_service, evidence_service, doc_render_service, notification_service, multilingual_service
│   │   ├── tasks/                  # Celery tasks (AI, documents, notifications)
│   │   └── main.py
│   ├── alembic/                    # migrations
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   └── src/
│       ├── app/                    # dashboard, cases, fir, legal, judgments, evidence, documents, diary, cyber, analytics, admin, login
│       ├── components/
│       ├── lib/                    # api.ts, store.ts, utils.ts
│       └── types/
├── scripts/
│   ├── init_db.sql                 # DB init + initial accounts
│   └── ingest_legal_corpus.py      # Real judgments ingestion — never inserts sample data
├── docker/nginx/
├── docker-compose.yml
└── README.md
```

---

## License

Proprietary.
