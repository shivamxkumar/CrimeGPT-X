"""
CrimeGPT-X Backend Tests
Run: pytest tests/ -v --asyncio-mode=auto
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.core.auth import hash_password
from app.models.models import User, UserRole

# ── Test DB (SQLite in-memory) ────────────────────────────────
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DB_URL, echo=False)
TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(scope="function", autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


@pytest_asyncio.fixture
async def test_user():
    async with TestSessionLocal() as session:
        user = User(
            badge_number="TEST-001",
            name="Test Officer",
            email="test@police.gov.in",
            hashed_password=hash_password("testpass123"),
            role=UserRole.IO,
            police_station="Test Station",
            is_active=True,
            is_verified=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user


@pytest_asyncio.fixture
async def auth_token(client: AsyncClient, test_user: User):
    response = await client.post("/api/v1/auth/login", json={
        "badge_number": "TEST-001",
        "password": "testpass123",
    })
    assert response.status_code == 200
    return response.json()["access_token"]


# ── Auth Tests ────────────────────────────────────────────────

class TestAuth:
    async def test_login_success(self, client: AsyncClient, test_user: User):
        r = await client.post("/api/v1/auth/login", json={
            "badge_number": "TEST-001", "password": "testpass123"
        })
        assert r.status_code == 200
        data = r.json()
        assert "access_token" in data
        assert data["user"]["badge_number"] == "TEST-001"

    async def test_login_wrong_password(self, client: AsyncClient, test_user: User):
        r = await client.post("/api/v1/auth/login", json={
            "badge_number": "TEST-001", "password": "wrongpass"
        })
        assert r.status_code == 401

    async def test_login_unknown_badge(self, client: AsyncClient):
        r = await client.post("/api/v1/auth/login", json={
            "badge_number": "UNKNOWN-999", "password": "testpass"
        })
        assert r.status_code == 401

    async def test_register_user(self, client: AsyncClient):
        r = await client.post("/api/v1/auth/register", json={
            "badge_number": "NEW-002",
            "name": "New Officer",
            "email": "new@police.gov.in",
            "password": "newpass123",
            "role": "io",
        })
        assert r.status_code == 201
        assert r.json()["badge_number"] == "NEW-002"

    async def test_get_me(self, client: AsyncClient, auth_token: str):
        r = await client.get("/api/v1/auth/me",
                             headers={"Authorization": f"Bearer {auth_token}"})
        assert r.status_code == 200
        assert r.json()["badge_number"] == "TEST-001"

    async def test_protected_without_token(self, client: AsyncClient):
        r = await client.get("/api/v1/auth/me")
        assert r.status_code == 403  # No credentials

    async def test_logout(self, client: AsyncClient, auth_token: str):
        r = await client.post("/api/v1/auth/logout",
                              headers={"Authorization": f"Bearer {auth_token}"})
        assert r.status_code == 200


# ── Case Tests ────────────────────────────────────────────────

class TestCases:
    async def test_create_case(self, client: AsyncClient, auth_token: str):
        r = await client.post("/api/v1/cases/", json={
            "crime_category": "upi_fraud",
            "priority": "high",
            "victim_name": "Test Victim",
            "victim_phone": "+91 9999999999",
            "amount_defrauded": 50000.0,
            "accused_name": "Unknown",
            "incident_description": "Test victim received a WhatsApp call impersonating SBI and was asked to install AnyDesk.",
        }, headers={"Authorization": f"Bearer {auth_token}"})
        assert r.status_code == 201
        data = r.json()
        assert data["victim_name"] == "Test Victim"
        assert data["case_id"].startswith("CC/")

    async def test_list_cases(self, client: AsyncClient, auth_token: str):
        r = await client.get("/api/v1/cases/",
                             headers={"Authorization": f"Bearer {auth_token}"})
        assert r.status_code == 200
        assert "items" in r.json()
        assert "total" in r.json()

    async def test_case_requires_auth(self, client: AsyncClient):
        r = await client.get("/api/v1/cases/")
        assert r.status_code == 403

    async def test_case_stats(self, client: AsyncClient, auth_token: str):
        r = await client.get("/api/v1/cases/stats/summary",
                             headers={"Authorization": f"Bearer {auth_token}"})
        assert r.status_code == 200
        assert "total" in r.json()

    async def test_get_case_by_slash_containing_case_id(self, client: AsyncClient, auth_token: str):
        """Regression test: case_id values look like 'CC/2026/0001' — a bare
        FastAPI path param doesn't match embedded slashes, and comparing a
        non-UUID string against a UUID column raises a DBAPI error unless
        guarded. Both bugs were invisible until real HTTP calls exercised them."""
        headers = {"Authorization": f"Bearer {auth_token}"}
        created = await client.post("/api/v1/cases/", json={
            "crime_category": "phishing",
            "victim_name": "Slash Test Victim",
            "accused_name": "Unknown",
            "incident_description": "Victim received a phishing email and entered banking credentials on a fake site.",
        }, headers=headers)
        case_id = created.json()["case_id"]
        assert "/" in case_id

        r = await client.get(f"/api/v1/cases/{case_id}", headers=headers)
        assert r.status_code == 200
        assert r.json()["case_id"] == case_id
        assert "evidence_count" in r.json()

        # /stats/summary must still resolve to the stats endpoint, not be
        # swallowed by the greedy {case_id:path} case-lookup route.
        stats = await client.get("/api/v1/cases/stats/summary", headers=headers)
        assert stats.status_code == 200
        assert "total" in stats.json()

        r = await client.patch(f"/api/v1/cases/{case_id}", json={"priority": "critical"}, headers=headers)
        assert r.status_code == 200
        assert r.json()["priority"] == "critical"

    async def test_get_case_unknown_id_returns_404_not_500(self, client: AsyncClient, auth_token: str):
        """A case_id that is neither a real case_id nor a valid UUID must 404
        cleanly, not raise a DBAPI error from comparing it against Case.id."""
        r = await client.get("/api/v1/cases/CC/9999/9999",
                             headers={"Authorization": f"Bearer {auth_token}"})
        assert r.status_code == 404


# ── Health Tests ──────────────────────────────────────────────

class TestHealth:
    async def test_health_endpoint(self, client: AsyncClient):
        r = await client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "healthy"

    async def test_root_endpoint(self, client: AsyncClient):
        r = await client.get("/")
        assert r.status_code == 200
        assert "CrimeGPT-X" in r.json()["message"]


# ── Analytics Tests ───────────────────────────────────────────

class TestAnalytics:
    async def test_overview(self, client: AsyncClient, auth_token: str):
        r = await client.get("/api/v1/analytics/overview",
                             headers={"Authorization": f"Bearer {auth_token}"})
        assert r.status_code == 200
        data = r.json()
        assert "total_cases" in data
        assert "active_cases" in data

    async def test_crime_distribution(self, client: AsyncClient, auth_token: str):
        r = await client.get("/api/v1/analytics/crime-distribution",
                             headers={"Authorization": f"Bearer {auth_token}"})
        assert r.status_code == 200
        assert isinstance(r.json(), list)
