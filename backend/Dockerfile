FROM python:3.12-slim

# System deps for OCR (tesseract) + PDF processing + WeasyPrint (HTML->PDF
# export). No libgl1/libsm6/libxext6/libxrender-dev — those were only for
# easyocr's OpenCV dependency, which is no longer installed.
RUN apt-get update && apt-get install -y \
    build-essential \
    tesseract-ocr \
    tesseract-ocr-hin \
    tesseract-ocr-guj \
    poppler-utils \
    libglib2.0-0 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libpangoft2-1.0-0 \
    libcairo2 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    shared-mime-info \
    fonts-noto-core \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps. No torch/easyocr/sentence-transformers here — OCR
# runs on tesseract (already installed above) and embeddings go through the
# Gemini API, keeping the image and runtime memory small enough for
# free-tier hosts (e.g. Render's 512MB instance).
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

# Create non-root user for security
RUN useradd -m crimegpt && chown -R crimegpt:crimegpt /app
USER crimegpt

EXPOSE 8000

# Shell form so ${PORT} expands — Railway/Render inject a dynamic PORT at
# runtime. WEB_CONCURRENCY defaults to 1: each worker is a separate process
# with its own memory footprint, and free-tier plans (Render: 512MB) have
# little headroom to spare. Raise it via an env var on a plan with more RAM.
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers ${WEB_CONCURRENCY:-1} --loop uvloop
