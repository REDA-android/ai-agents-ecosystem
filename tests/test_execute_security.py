import pytest
from httpx import AsyncClient, ASGITransport
from server.app import app

@pytest.mark.asyncio
async def test_safe_code_execution():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/code/execute", json={"code": "print('Hello Security!')", "language": "python"})
        assert response.status_code == 200
        data = response.json()
        assert data["exit_code"] == 0
        assert "Hello Security!" in data["output"]

@pytest.mark.asyncio
async def test_blocked_os_import():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/code/execute", json={"code": "import os\nos.system('ls')", "language": "python"})
        assert response.status_code == 200
        data = response.json()
        assert data["exit_code"] == 1
        assert "Security Error" in data["output"]
        assert "os" in data["output"]

@pytest.mark.asyncio
async def test_blocked_eval():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/code/execute", json={"code": "eval('1 + 1')", "language": "python"})
        assert response.status_code == 200
        data = response.json()
        assert data["exit_code"] == 1
        assert "Security Error" in data["output"]
        assert "eval" in data["output"]
