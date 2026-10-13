from fastapi.testclient import TestClient
from server.app import app

client = TestClient(app)

def test_execute_code_security_blocked():
    payload = {
        "code": "import os\nos.system('rm -rf /')",
        "language": "python"
    }
    response = client.post("/api/code/execute", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert "exit_code" in data
    # Ideally, it should be blocked and return an error code like 1, and the message should say it was blocked
    assert data["exit_code"] != 0, "Command should have been blocked"
    assert "interceptée" in data["output"].lower() or "bloquée" in data["output"].lower() or "sandbox" in data["output"].lower()
