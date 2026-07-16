"""Shared HTTP response helpers."""
import re
from urllib.parse import quote


def content_disposition(filename: str) -> str:
    """Build a Content-Disposition header safe for HTTP (latin-1-only) headers
    while still preserving non-ASCII filenames (e.g. Devanagari/Gujarati) for
    browsers, via the RFC 5987 filename* parameter."""
    ascii_fallback = re.sub(r"[^A-Za-z0-9._-]", "_", filename) or "file"
    return f"attachment; filename=\"{ascii_fallback}\"; filename*=UTF-8''{quote(filename)}"
