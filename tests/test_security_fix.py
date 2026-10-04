from fastapi.testclient import TestClient
from server.app import app

client = TestClient(app)

def test_execute_code_security_block():
    # Attempting to execute a malicious OS command
    malicious_code = "import os\nos.system('rm -rf /')"
    response = client.post("/api/code/execute", json={"code": malicious_code, "language": "python"})

    # It should not have crashed and should return a 200 JSON with exit_code 1
    assert response.status_code == 200
    data = response.json()
    assert data["exit_code"] == 1
    assert "Security Error" in data["output"]

def test_execute_code_safe_allow():
    # Attempting to execute safe code
    safe_code = "print('Hello World')"
    response = client.post("/api/code/execute", json={"code": safe_code, "language": "python"})

    assert response.status_code == 200
    data = response.json()
    assert data["exit_code"] == 0
    assert "Hello World" in data["output"]
