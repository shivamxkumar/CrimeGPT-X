FROM python:3.12-slim

# System deps for OCR + PDF processing + WeasyPrint (HTML->PDF export)
RUN apt-get update && apt-get install -y \
    build-essential \
    tesseract-ocr \
    tesseract-ocr-hin \
    tesseract-ocr-guj \
    poppler-utils \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
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

# Install Python deps
COPY requirements.txt .
# Install CPU-only PyTorch first (from the official CPU wheel index) so that
# sentence-transformers/easyocr resolve against it below instead of pulling
# the default CUDA-enabled wheel and its nvidia-*/triton dependencies.
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu \
        torch==2.13.0+cpu torchvision==0.28.0+cpu && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

# Create non-root user for security
RUN useradd -m crimegpt && chown -R crimegpt:crimegpt /app
USER crimegpt

EXPOSE 8000

# Shell form so ${PORT} expands — Railway injects a dynamic PORT at runtime.
# WEB_CONCURRENCY defaults to 1: each worker is a separate process with its
# own memory footprint, and 4 workers alongside easyocr/sentence-transformers
# exceeds a 1GB plan's memory limit and gets OOM-killed shortly after
# startup (observed on Railway's trial plan). Raise it via an env var once
# deployed on a plan with more headroom.
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers ${WEB_CONCURRENCY:-1} --loop uvloop
