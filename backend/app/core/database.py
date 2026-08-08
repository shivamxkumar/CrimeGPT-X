from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


def _make_engine():
    # Hosted Postgres providers (Neon, Supabase, ...) hand out connection
    # strings with libpq-style query params — `sslmode=require`,
    # `channel_binding=require` — that asyncpg doesn't recognize and raises
    # on connect if left in the DSN. Strip them and translate sslmode into
    # the `ssl` connect_arg asyncpg does understand.
    url = make_url(settings.DATABASE_URL)
    query = dict(url.query)
    sslmode = query.pop("sslmode", None)
    query.pop("channel_binding", None)
    connect_args = {"ssl": True} if sslmode and sslmode != "disable" else {}
    url = url.set(query=query)

    return create_async_engine(
        url,
        pool_size=settings.DATABASE_POOL_SIZE,
        max_overflow=settings.DATABASE_MAX_OVERFLOW,
        echo=settings.DEBUG,
        pool_pre_ping=True,
        connect_args=connect_args,
    )


engine = _make_engine()

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
