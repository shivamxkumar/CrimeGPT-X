from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings

# In-memory storage (slowapi's default) keeps a separate counter per uvicorn
# worker process, so a 4-worker deployment effectively allows ~4x the
# configured limit before every worker has independently tripped it. Redis
# gives all workers (and, on Railway, all instances) a single shared counter.
limiter = Limiter(key_func=get_remote_address, storage_uri=settings.REDIS_URL)
