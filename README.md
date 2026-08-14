<div align="center">

# 🔍 CrimeGPT-X
### AI-Powered Crime Documentation & Legal Intelligence Platform

**"From FIR to Arrest — One Intelligent Investigation Platform"**

<br/>

[![Python](https://img.shields.io/badge/Python_3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy_2.0-D71F00?style=for-the-badge&logoColor=white)](https://www.sqlalchemy.org/)
[![Pydantic](https://img.shields.io/badge/Pydantic_v2-E92063?style=for-the-badge&logo=pydantic&logoColor=white)](https://docs.pydantic.dev/)

[![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-FF6F00?style=for-the-badge&logoColor=white)](https://www.trychroma.com/)
[![JWT](https://img.shields.io/badge/JWT_Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com/)
[![Neon](https://img.shields.io/badge/Neon_Postgres-00E599?style=for-the-badge&logo=neon&logoColor=white)](https://neon.tech/)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare_R2-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/r2/)
[![License](https://img.shields.io/badge/License-Proprietary-6c757d?style=for-the-badge)]()

</div>

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
| FIR OCR Extraction | Tesseract (default) + EasyOCR (optional) | Real multi-language OCR (EN/HI/GU) |
| Landmark Judgment RAG Search | ChromaDB + Gemini Embeddings | Returns real indexed judgments, or a clear empty-state message if none are ingested yet — never fabricated |
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
│ Gemini │ Tesseract   │ MinIO+SHA256│ AI Jobs · Notifications   │
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
| Framework | FastAPI (Python 3.12), async throughout |
| ORM | SQLAlchemy 2.0 (Async) |
| Database | PostgreSQL 16 + pg_trgm (Neon, managed, in production) |
| Migrations | Alembic |
| Auth | JWT + bcrypt (passlib) |
| Task Queue | Celery + Redis + Celery Beat (defined for local/Compose use) |
| Validation | Pydantic v2 |

### AI / ML
| Component | Technology |
|-----------|-----------|
| LLM | Google Gemini (`google-genai` SDK) |
| RAG | ChromaDB + Gemini Embeddings (`gemini-embedding-001`) |
| OCR Primary | Tesseract + pytesseract (default, lightweight) |
| OCR Optional | EasyOCR — English + Hindi + Gujarati, opt-in via `OCR_ENGINE=easyocr` |
| PDF Export | WeasyPrint (real HTML → PDF) |
| DOCX Export | python-docx + BeautifulSoup (real HTML → DOCX) |

### Infrastructure
| Component | Technology |
|-----------|-----------|
| Containerization | Docker + Docker Compose |
| Object Storage | MinIO client (S3-compatible) → Cloudflare R2 in production; local MinIO for dev |
| Cache / Broker | Redis 7 (Upstash in production) |
| Reverse Proxy | Nginx (local/Compose) |
| Monitoring | Flower (Celery) + pgAdmin |

---

## Local Development

### Prerequisites
- Docker & Docker Compose v2+
- Node.js 20+ (frontend dev outside Docker)
- Python 3.12+ (backend dev outside Docker) — plus Tesseract if running OCR outside Docker (see step 3; the Docker image already includes it)
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

Initial accounts are seeded automatically on backend startup by
`app/core/seed.py` (badge number / password `demo1234` for each role) —
it only runs when the `users` table is empty, so it's a no-op once real
accounts exist. Set `SEED_DEMO_DATA=false` to disable it outright. Rotate
these passwords (or disable seeding) before any real deployment.

### 3. Backend outside Docker

OCR runs on Tesseract by default (no heavy ML deps required). Install it first —
macOS: `brew install tesseract tesseract-lang`; Debian/Ubuntu:
`apt-get install tesseract-ocr tesseract-ocr-hin tesseract-ocr-guj poppler-utils`
(the Docker image already has these baked in, see `backend/Dockerfile`).

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
| `DATABASE_URL` | Postgres connection string (`postgresql+asyncpg://...`). Hosted-provider DSNs (Neon, Supabase) with `?sslmode=require&channel_binding=require` work as-is — the app strips/translates those for asyncpg automatically |
| `JWT_SECRET_KEY` / `SECRET_KEY` | Random secrets — generate with `openssl rand -hex 32` |
| `REDIS_URL` | Celery broker/result backend (e.g. an Upstash Redis URL in production) |
| `CHROMA_HOST` / `CHROMA_PORT` | Point at a real ChromaDB server for judgment RAG. **Leave `CHROMA_HOST` empty** to use an embedded on-disk store instead — no separate service needed, used for free-tier deploys |
| `MINIO_ENDPOINT` / `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` / `MINIO_SECURE` | Evidence/document object storage — local MinIO, or any S3-compatible provider (e.g. Cloudflare R2; set `MINIO_SECURE=true` for R2/S3, which require HTTPS) |
| `UPLOAD_FOLDER`, `PORT` | Local temp-file path and backend listen port (`PORT` is injected automatically on Render) |
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

The current, tested target is **Render + Neon + Upstash + Cloudflare R2** —
chosen specifically to fit free/low-cost tiers (the backend image drops all
heavy local ML dependencies; see [Technology Stack](#technology-stack)). A
`railway.toml` is still present for anyone who prefers Railway instead, but
it isn't the maintained path and isn't documented step-by-step below.

### Frontend → Vercel

```bash
cd frontend
npm i -g vercel
vercel login
vercel link
vercel env add NEXT_PUBLIC_API_URL production   # https://<your-backend>.onrender.com/api/v1
vercel --prod
```

`frontend/vercel.json` is preconfigured for the Next.js build.

### Database → Neon, Cache → Upstash, Storage → Cloudflare R2

Provision these first, then wire their connection details into the backend's
env vars in the next step:

- **[Neon](https://neon.tech)** — create a project, copy the pooled connection
  string as `DATABASE_URL` (with the `postgresql+asyncpg://` scheme).
  Neon's `?sslmode=require&channel_binding=require` query params are handled
  automatically — no manual URL editing needed (see `app/core/database.py`).
- **[Upstash](https://upstash.com)** — create a Redis database, copy its
  connection string as `REDIS_URL`.
- **[Cloudflare R2](https://developers.cloudflare.com/r2/)** — create a bucket
  and an R2 API token. Set `MINIO_ENDPOINT` to the R2 S3 endpoint
  (`<account-id>.r2.cloudflarestorage.com`), `MINIO_ACCESS_KEY` /
  `MINIO_SECRET_KEY` from the token, and `MINIO_SECURE=true` (R2 requires
  HTTPS).

### Backend → Render

Create a new Web Service pointed at this repo with `backend/Dockerfile` as
the build. Render injects `PORT` automatically — the Dockerfile's `CMD`
already binds `${PORT}` and defaults to a single uvicorn worker
(`WEB_CONCURRENCY=1`) to fit a 512MB instance.

Set these environment variables on the service: `GEMINI_API_KEY`,
`JWT_SECRET_KEY`, `SECRET_KEY`, `ALLOWED_ORIGINS` (include your Vercel URL),
`DATABASE_URL` (Neon), `REDIS_URL` (Upstash), `MINIO_ENDPOINT` /
`MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` / `MINIO_SECURE=true` (R2).
**Leave `CHROMA_HOST` unset** — the app falls back to an embedded, on-disk
ChromaDB store with no separate vector-database service to provision.

This single-service deployment does not run a Celery worker: PDF/DOCX
export and AI calls execute inline on the request thread
(`asyncio.to_thread`), not through the task queue. `app/tasks/` and
`docker-compose.yml`'s `worker`/`beat` services exist for local development
and future horizontal scaling, but nothing in the current codebase actually
dispatches to them (`app/services/ai_service.py`'s Gemini calls and
`app/tasks/doc_tasks.py`'s renderers run directly) — so no extra Render
service is required for the app to function as shipped.

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
│       ├── lib/                    # api.ts, store.ts, utils.ts, i18n.ts (EN/HI/GU), demo/ (mock data layer)
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
