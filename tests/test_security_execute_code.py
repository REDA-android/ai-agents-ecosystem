from fastapi.testclient import TestClient

from server.app import _is_safe_code, app

client = TestClient(app)

def test_is_safe_code_function():
    assert _is_safe_code("print('Hello World')") is True
    assert _is_safe_code("import math\nmath.cos(1)") is True
    assert _is_safe_code("import os") is False
    assert _is_safe_code("import subprocess") is False
    assert _is_safe_code("import sys") is False
    assert _is_safe_code("from os import path") is False
    assert _is_safe_code("eval('1+1')") is False
    assert _is_safe_code("exec('1+1')") is False
    assert _is_safe_code("__builtins__.eval('1+1')") is False
    assert _is_safe_code("x.__builtins__") is False

def test_execute_code_endpoint_safe():
    response = client.post("/api/code/execute", json={
        "code": "print('Safe')",
        "language": "python"
    })
    assert response.status_code == 200
    assert "Safe\n" == response.json().get("output") or "Safe" in response.json().get("output")
    assert response.json().get("exit_code") == 0

def test_execute_code_endpoint_unsafe():
    response = client.post("/api/code/execute", json={
        "code": "import os\nos.system('whoami')",
        "language": "python"
    })
    assert response.status_code == 200
    assert response.json().get("exit_code") == 1
    assert "Code non sécurisé détecté" in response.json().get("output")
