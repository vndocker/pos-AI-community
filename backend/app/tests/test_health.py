import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.main import app
from app.database import get_db

client = TestClient(app)

async def override_get_db():
    """Mock database session for testing."""
    try:
        db = AsyncSession()
        yield db
    finally:
        await db.close()

app.dependency_overrides[get_db] = override_get_db

def test_health_check():
    """Test health check endpoint returns correct structure."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    
    # Check response structure
    assert "status" in data
    assert "timestamp" in data
    assert "database" in data
    assert "status" in data["database"]
    assert "responseTime" in data["database"]
    
    # Check values
    assert data["status"] == "ok"
    assert data["database"]["status"] == "ok"
    assert isinstance(data["database"]["responseTime"], str)
    assert data["database"]["responseTime"].endswith("ms")

def test_health_check_headers():
    """Test health check endpoint has correct headers."""
    response = client.get("/health")
    assert response.status_code == 200
    assert "no-cache" in response.headers.get("Cache-Control", "")

@pytest.mark.asyncio
async def test_database_error():
    """Test health check handles database errors correctly."""
    async def error_db():
        raise Exception("Database connection error")
        yield None
    
    app.dependency_overrides[get_db] = error_db
    response = client.get("/health")
    assert response.status_code == 503
    assert "Database connection error" in response.json()["detail"]
    
    # Reset the override
    app.dependency_overrides[get_db] = override_get_db
