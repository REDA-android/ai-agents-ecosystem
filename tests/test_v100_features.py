from fastapi.testclient import TestClient
from server.app import app
from core.analytics.token_tracker import token_tracker

client = TestClient(app)

def test_health_v100():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["version"] == "1.0.0"

def test_token_analytics_endpoint():
    # Record some usage directly
    token_tracker.record_usage("gemini/gemini-2.0-flash", prompt_tokens=500, completion_tokens=150)
    token_tracker.record_usage("ollama/llama3.2", prompt_tokens=300, completion_tokens=100)

    res = client.get("/api/analytics/tokens")
    assert res.status_code == 200
    data = res.json()
    assert "total_tokens" in data
    assert data["total_tokens"] >= 1050
    assert "total_cost_usd" in data
    assert "budget_limit_usd" in data
    assert len(data["recent_entries"]) >= 2

def test_scheduler_endpoints():
    res = client.get("/api/scheduler/jobs")
    assert res.status_code == 200
    data = res.json()
    assert "jobs" in data
    assert len(data["jobs"]) >= 2
    job_ids = [j["id"] for j in data["jobs"]]
    assert "daily_brief" in job_ids

    # Trigger job
    trigger_res = client.post("/api/scheduler/trigger", json={"job_id": "daily_brief"})
    assert trigger_res.status_code == 200
    trigger_data = trigger_res.json()
    assert trigger_data["status"] == "triggered"
    assert "executed_at" in trigger_data

def test_tool_builder_endpoint():
    res = client.post("/api/tools/generate", json={
        "description": "Calculer la distance de Levenshtein entre deux chaînes de caractères"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "created"
    assert "tool_name" in data
    assert data["active_in_mcp_hub"] is True

def test_self_healing_endpoint():
    res = client.post("/api/self-healing/heal", json={
        "original_code": "def divide(a, b):\n    return a / b",
        "error_message": "ZeroDivisionError: division by zero",
        "goal": "Gérer la division par zéro en retournant None"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healed"
    assert "final_code" in data
    assert len(data["attempts"]) > 0

def test_claude_chat_endpoint():
    res = client.post("/api/chat/claude", json={
        "message": "Bonjour Claude, peux-tu m'écrire une fonction de tri en Python ?",
        "model": "claude-3-5-sonnet",
        "deep_thinking": True
    })
    assert res.status_code == 200
    data = res.json()
    assert "response" in data
    assert "tokens" in data
    assert data["tokens"]["total"] > 0


def test_code_execute_security():
    res = client.post("/api/code/execute", json={
        "code": "import os; os.system('rm -rf /')",
        "language": "python"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["exit_code"] == 1
    assert data["output"].startswith("Sécurité :")
