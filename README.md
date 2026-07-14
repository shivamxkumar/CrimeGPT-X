# 🔍 CrimeGPT — AI-Powered Crime Documentation & Legal Intelligence Platform

> **"From FIR to Arrest — One Intelligent Investigation Platform"**
>
> Built for KANAD S.H.I.E.L.D. 2026 Hackathon · Ahmedabad Cyber Crime Branch

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Architecture](#architecture)
4. [Technology Stack](#technology-stack)
5. [Quick Start](#quick-start)
6. [Demo Walkthrough](#demo-walkthrough)
7. [API Documentation](#api-documentation)
8. [Module Breakdown](#module-breakdown)
9. [AI Components](#ai-components)
10. [Security](#security)
11. [Deployment](#deployment)
12. [Project Structure](#project-structure)

---

## Overview

CrimeGPT is a full-stack AI-powered police investigation platform that eliminates repetitive data entry and automates legal documentation for cyber crime cases. Officers enter case data **once** — CrimeGPT automatically generates all required legal documents, suggests applicable BNS/IT Act sections, retrieves landmark judgments, and maintains a timestamped investigation diary.

### Core Problem Solved
Police officers repeatedly enter the same information across multiple legal documents (chargesheet, remand request, panchanama, medical letter, etc.). CrimeGPT maintains a **single source of truth** per case and auto-generates all required documents.

---

## Key Features

| Feature | Technology | Status |
|---------|-----------|--------|
| AI BNS Section Recommendation | Claude Sonnet 4 (Anthropic) | ✅ Live |
| FIR OCR Extraction | EasyOCR + Tesseract | ✅ Live |
| Landmark Judgment RAG | ChromaDB + Sentence Transformers | ✅ Live |
| Legal AI Chat Assistant | Claude Sonnet 4 | ✅ Live |
| Auto Document Generation | Claude Sonnet 4 + Jinja2 | ✅ Live |
| SHA-256 Evidence Integrity | Python hashlib | ✅ Live |
| Chain of Custody Tracking | PostgreSQL JSONB | ✅ Live |
| Multilingual Support | EasyOCR (EN/HI/GU) | ✅ Live |
| Role-Based Access Control | JWT + FastAPI | ✅ Live |
| Immutable Audit Trail | PostgreSQL + Middleware | ✅ Live |
| Cyber Threat Detection | Claude AI | ✅ Live |
| Case Diary Automation | Auto on every action | ✅ Live |
| Real-time Notifications | Redis pub/sub | ✅ Live |

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
│ Engine │ Service     │ Service     │ (Async Tasks)              │
│ Claude │ EasyOCR     │ MinIO+SHA256│ AI Jobs · Notifications   │
└────┬───┴──────┬──────┴─────┬───────┴───────────────────────────┘
     │          │             │
┌────▼──┐ ┌───▼──────┐ ┌────▼──────┐ ┌──────────┐ ┌──────────┐
│Claude │ │ ChromaDB │ │PostgreSQL │ │  MinIO   │ │  Redis   │
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
| Styling | TailwindCSS + Custom CSS Variables |
| State Management | Zustand + React Query |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| File Upload | React Dropzone |
| Animations | Framer Motion |
| Notifications | React Hot Toast |

### Backend
| Component | Technology |
|-----------|-----------|
| Framework | FastAPI (Python 3.12) |
| ORM | SQLAlchemy 2.0 (Async) |
| Database | PostgreSQL 16 + pg_trgm |
| Migrations | Alembic |
| Auth | JWT + bcrypt (passlib) |
| Task Queue | Celery + Redis |
| Validation | Pydantic v2 |

### AI / ML
| Component | Technology |
|-----------|-----------|
| LLM | Claude Sonnet 4 (Anthropic) |
| RAG | LangChain + ChromaDB |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| OCR Primary | EasyOCR (English + Hindi + Gujarati) |
| OCR Fallback | Tesseract + pytesseract |
| PDF Processing | pdf2image + Pillow |

### Infrastructure
| Component | Technology |
|-----------|-----------|
| Containerization | Docker + Docker Compose |
| Object Storage | MinIO (S3-compatible) |
| Cache | Redis 7 |
| Reverse Proxy | Nginx |
| Monitoring | Flower (Celery) + pgAdmin |

---

## Quick Start

### Prerequisites
- Docker & Docker Compose v2+
- Node.js 20+ (for local frontend dev)
- Python 3.12+ (for local backend dev)
- Anthropic API Key

### 1. Clone & Configure
```bash
git clone https://github.com/your-org/crimegpt.git
cd crimegpt

# Copy environment file
cp .env.example .env

# Set your Anthropic API key
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" >> .env
```

### 2. Launch with Docker Compose
```bash
# Start all services
docker compose up -d

# Watch logs
docker compose logs -f backend

# Seed the vector database with landmark judgments
docker compose exec backend python scripts/seed_chroma.py
```

### 3. Access the Application
| Service | URL |
|---------|-----|
| **CrimeGPT App** | http://localhost |
| Backend API | http://localhost:8000/api/docs |
| MinIO Console | http://localhost:9001 |
| pgAdmin | http://localhost:5050 |
| Flower (Celery) | http://localhost:5555 |

### 4. Login Credentials (Demo)
| Role | Badge Number | Password |
|------|-------------|----------|
| Investigation Officer | AHM-24-IO-047 | demo1234 |
| SHO / Supervisor | AHM-23-SHO-012 | demo1234 |
| Legal Advisor | LEG-24-001 | demo1234 |
| Administrator | ADM-24-001 | demo1234 |

### Local Development
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev  # → http://localhost:3000

# Seed ChromaDB (after starting chromadb service)
docker compose up -d chromadb
python scripts/seed_chroma.py
```

---

## Demo Walkthrough

**Target: Complete demo in under 3 minutes**

### Step-by-Step (Judge Demo Flow)

**1. Login** (15 sec)
- Open http://localhost
- Login: `AHM-24-IO-047` / `demo1234`
- Show the Command Dashboard with live case statistics

**2. FIR Upload + OCR** (30 sec)
- Navigate to **FIR Upload**
- Drop any PDF/image (or click Upload FIR)
- Watch OCR progress bar extract 18 fields automatically
- Show editable extracted fields

**3. AI Legal Analysis** (45 sec)
- Click "Analyze with AI → Legal Sections"
- Watch AI thinking animation
- BNS 318 (93%), BNS 319 (91%), IT Act 66C (88%), IT Act 66D (86%) appear
- Ask Legal AI Chat: *"What evidence is needed for IT Act 66D prosecution?"*
- Get real AI response

**4. Landmark Judgments** (20 sec)
- Navigate to **Judgment Search**
- See "State of Karnataka vs. Soman — 94% Match"
- Click "Add to Chargesheet"

**5. Evidence Vault** (20 sec)
- Navigate to **Evidence Vault**
- Drop a file → SHA-256 hash generates instantly
- Show chain of custody panel

**6. Document Generation** (30 sec)
- Navigate to **Documents**
- Click "Generate" on Chargesheet
- Preview AI-generated chargesheet with all case data pre-filled
- Click "Export PDF"

**7. Case Diary** (15 sec)
- Navigate to **Case Diary**
- Show auto-populated timeline (every action logged automatically)

**8. Analytics + Admin** (15 sec)
- Show Analytics → crime distribution pie chart
- Show Admin → Audit Logs with IP tracking

---

## API Documentation

Interactive Swagger UI available at: `http://localhost:8000/api/docs`

### Core Endpoints

#### Authentication
```
POST /api/v1/auth/login          # JWT login
POST /api/v1/auth/register       # Register new officer
GET  /api/v1/auth/me             # Get current user
POST /api/v1/auth/logout         # Logout
```

#### Cases
```
GET    /api/v1/cases             # List cases (with filters)
POST   /api/v1/cases             # Create new case
GET    /api/v1/cases/{id}        # Get case details
PATCH  /api/v1/cases/{id}        # Update case
GET    /api/v1/cases/stats/summary  # Dashboard stats
```

#### AI Legal Intelligence
```
POST /api/v1/ai/analyze          # FIR text → BNS sections
POST /api/v1/ai/chat             # Legal AI conversation
POST /api/v1/ai/cyber-analyze    # Cyber threat detection
```

#### FIR & OCR
```
POST /api/v1/fir/upload          # Upload FIR → OCR extraction
```

#### Documents
```
POST /api/v1/documents/generate  # Generate legal document
GET  /api/v1/documents/{case_id} # List case documents
```

#### Evidence
```
POST /api/v1/evidence/{case_id}/upload  # Upload evidence file
GET  /api/v1/evidence/{case_id}         # List evidence
```

#### Analytics
```
GET /api/v1/analytics/overview           # Summary stats
GET /api/v1/analytics/crime-distribution # By category
```

---

## Module Breakdown

### Module 1: Authentication & RBAC
- JWT tokens (8-hour validity for police shifts)
- 4 roles: IO, SHO, Legal Advisor, Admin
- Badge number + password login
- OTP verification (framework ready)

### Module 2: Case Management
- Auto-generated sequential Case IDs (CC/YYYY/NNNN)
- Single source of truth — no duplicate fields
- Full victim + accused + witness data model
- PostgreSQL full-text search with pg_trgm

### Module 3: FIR OCR Pipeline
- EasyOCR primary (multi-language: EN/HI/GU)
- Tesseract fallback for low-quality scans
- Regex NER for 12+ structured fields
- Confidence scoring per extracted field

### Module 4: AI Legal Intelligence Engine
- Claude Sonnet 4 analyzes FIR text
- Returns BNS, BNSS, IT Act sections with confidence scores
- Structured JSON output with legal reasoning
- Fallback logic when API unavailable

### Module 5: RAG Judgment Retrieval
- ChromaDB vector store with 6+ landmark judgments seeded
- Sentence Transformers (all-MiniLM-L6-v2) for embeddings
- Top-K cosine similarity retrieval
- Section-aware query construction

### Module 6: Document Generation
- 8 document types: Chargesheet, Remand, Panchanama, Seizure Receipt, etc.
- Claude generates HTML from structured case data prompts
- DOCX export via python-docx
- PDF via ReportLab / WeasyPrint
- Multilingual output (EN/HI/GU)

### Module 7: Case Diary Automation
- Every system action auto-creates a diary entry
- Immutable chronological timeline
- Manual notes support
- Chain of custody integrated

### Module 8: Evidence Management
- SHA-256 + MD5 hash on upload (integrity proof)
- MinIO S3-compatible object storage
- Chain of custody JSON tracking
- Image manipulation detection via PIL EXIF
- BSA Section 63 compliant metadata

### Module 9: Cyber Threat Detection
- URL/domain age analysis
- Chat message fraud pattern detection
- AI-powered classification with section mapping
- CERT-In integration ready

### Module 10: Analytics Engine
- Crime distribution charts (Recharts)
- Officer performance scoring
- Monthly trend analysis
- Document generation statistics

---

## AI Components

### Legal Analysis Prompt Architecture
```python
system = """
You are a senior legal AI for Gujarat Police Cyber Crime Branch.
Analyze FIRs and suggest BNS, BNSS, BSA, and IT Act sections.
Return ONLY structured JSON with confidence scores.
"""
```

### RAG Pipeline
```
FIR Text → Sentence Embedding → ChromaDB Query →
Top-K Judgments → AI Context Injection → Legal Chat Response
```

### Document Generation Template
```
Case Data (JSON) → Jinja2 Template + AI → HTML → PDF/DOCX
```

---

## Security

- **JWT Authentication** — 8-hour tokens, RS256 signing ready
- **Role-Based Access Control** — 4 tiers, endpoint-level enforcement
- **Immutable Audit Trail** — every action logged with IP, user, timestamp
- **Evidence Integrity** — SHA-256 hash on upload, verify on access
- **Input Validation** — Pydantic v2 for all API inputs
- **SQL Injection Prevention** — SQLAlchemy parameterized queries
- **File Upload Security** — MIME type validation, size limits, virus scan ready
- **Rate Limiting** — Nginx + Redis based
- **Security Headers** — X-Frame-Options, CSP, HSTS via Nginx

---

## Deployment

### Production Docker Compose
```bash
# Production deployment
ANTHROPIC_API_KEY=your-key docker compose -f docker-compose.yml up -d

# Scale backend workers
docker compose up -d --scale worker=3

# View all service health
docker compose ps
```

### Environment Variables
```env
# Required
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql+asyncpg://crimegpt:pass@db:5432/crimegpt_db
JWT_SECRET_KEY=your-secret-key-min-32-chars

# Optional (defaults work for local)
REDIS_URL=redis://redis:6379/0
MINIO_ENDPOINT=minio:9000
CHROMA_HOST=chromadb
```

---

## Project Structure

```
crimegpt/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/__init__.py          # Route registration
│   │   │   └── endpoints/
│   │   │       ├── auth.py             # Authentication
│   │   │       ├── cases.py            # Case CRUD
│   │   │       ├── fir.py              # FIR upload + OCR
│   │   │       ├── ai_analysis.py      # AI legal engine
│   │   │       ├── documents.py        # Doc generation
│   │   │       ├── evidence.py         # Evidence management
│   │   │       ├── diary.py            # Case diary
│   │   │       ├── analytics.py        # Stats + charts
│   │   │       ├── admin.py            # Admin panel
│   │   │       └── notifications.py    # Alerts
│   │   ├── core/
│   │   │   ├── config.py               # Settings (pydantic-settings)
│   │   │   ├── database.py             # Async SQLAlchemy
│   │   │   └── auth.py                 # JWT + RBAC
│   │   ├── models/
│   │   │   └── models.py               # All DB models
│   │   ├── schemas/
│   │   │   └── schemas.py              # Pydantic schemas
│   │   ├── services/
│   │   │   ├── ai_service.py           # Claude + RAG
│   │   │   ├── ocr_service.py          # EasyOCR + Tesseract
│   │   │   └── evidence_service.py     # MinIO + hashing
│   │   └── main.py                     # FastAPI app
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── dashboard/page.tsx      # Command dashboard
│       │   ├── cases/
│       │   │   ├── page.tsx            # Case list
│       │   │   ├── new/page.tsx        # New case form
│       │   │   └── [id]/page.tsx       # Case detail
│       │   ├── fir/page.tsx            # FIR upload + OCR
│       │   ├── legal/page.tsx          # AI legal engine
│       │   ├── judgments/page.tsx      # RAG judgment search
│       │   ├── evidence/page.tsx       # Evidence vault
│       │   ├── documents/page.tsx      # Document generation
│       │   ├── diary/page.tsx          # Case diary
│       │   ├── cyber/page.tsx          # Cyber detection
│       │   ├── analytics/page.tsx      # Analytics
│       │   ├── admin/page.tsx          # Admin panel
│       │   └── login/page.tsx          # Login
│       ├── components/
│       │   ├── layout/                 # AppShell, Sidebar, Topbar
│       │   ├── ui/                     # Reusable UI components
│       │   └── providers/              # React Query provider
│       ├── lib/
│       │   ├── api.ts                  # Axios API client
│       │   ├── store.ts                # Zustand auth store
│       │   └── utils.ts                # Helpers
│       └── types/index.ts              # TypeScript types
├── scripts/
│   ├── init_db.sql                     # DB init + seed data
│   └── seed_chroma.py                  # Vector DB seeder
├── data/
│   └── mock_dataset.json               # Demo data
├── docker/
│   └── nginx/nginx.conf                # Nginx config
├── docs/
│   └── architecture.svg                # Architecture diagram
├── docker-compose.yml                  # Full stack compose
└── README.md                           # This file
```

---

## Team & Credits

Built for **KANAD S.H.I.E.L.D. 2026** — National Cybersecurity & Law Enforcement Hackathon

**Problem Statement:** CrimeGPT – AI-Powered Automation for Crime Documentation and Legal Intelligence

**Demo Target:** Ahmedabad Cyber Crime Branch, Gujarat Police

---

## License

Proprietary — Built for KANAD SHIELD 2026 Hackathon
