from fastapi.testclient import TestClient
from server.app import app

client = TestClient(app)

def test_blueprints_endpoint():
    res = client.get("/api/blueprints")
    assert res.status_code == 200
    assert "blueprints" in res.json()

def test_tools_and_toggle_endpoint():
    res = client.get("/api/tools")
    assert res.status_code == 200
    tools = res.json()["tools"]
    assert len(tools) > 0

    toggle_res = client.post("/api/tools/toggle", json={"name": "browser_navigate", "enabled": False})
    assert toggle_res.status_code == 200
    assert toggle_res.json()["tool"]["enabled"] is False

    toggle_back = client.post("/api/tools/toggle", json={"name": "browser_navigate", "enabled": True})
    assert toggle_back.status_code == 200
    assert toggle_back.json()["tool"]["enabled"] is True

def test_mcp_external_endpoint():
    res = client.get("/mcp")
    assert res.status_code == 200
    assert res.json()["server_name"] == "omniagent-mcp-server"

def test_security_validate_endpoint():
    res = client.post("/api/security/validate", json={"command": "rm -rf /", "policy": "human_approval"})
    assert res.status_code == 200
    data = res.json()
    assert data["allowed"] is False

def test_memory_graph_endpoint():
    res = client.get("/api/memory/graph")
    assert res.status_code == 200
    assert "nodes" in res.json()

def test_browser_run_endpoint():
    res = client.post("/api/browser/run", json={"task": "Naviguer sur Google", "headless": True})
    assert res.status_code == 200
    assert res.json()["status"] == "success"

def test_autogen_chat_endpoint():
    res = client.post("/api/autogen/chat", json={"topic": "Design d'API", "rounds": 2})
    assert res.status_code == 200
    assert res.json()["status"] == "success"

def test_goose_dev_execute_endpoint():
    res = client.post("/api/dev/execute", json={"instruction": "Créer un script Python"})
    assert res.status_code == 200
    assert res.json()["status"] == "completed"

def test_benchmark_endpoint():
    res = client.post("/api/benchmark/run", json={"model": "gemini/gemini-1.5-flash"})
    assert res.status_code == 200
    assert "overall_score" in res.json()

def test_visual_workflow_run_endpoint():
    wf = {
        "workflow": {
            "name": "Pipeline_Test",
            "nodes": [
                {"id": "node1", "label": "Extracteur", "role": "researcher", "system_prompt": "Extraire les mots clés."},
                {"id": "node2", "label": "Validateur", "role": "reviewer", "system_prompt": "Valider le résultat."}
            ],
            "edges": [{"source": "node1", "target": "node2"}]
        },
        "input_text": "Exécuter la vérification du pipeline"
    }
    res = client.post("/api/workflows/run", json=wf)
    assert res.status_code == 200
    assert res.json()["status"] == "completed"

def test_code_execute_security():
    res = client.post("/api/code/execute", json={"code": "import os\nos.system('ls')"})
    assert res.status_code == 200
    data = res.json()
    assert data["exit_code"] == 1
    assert "Erreur de sécurité : Import non autorisé" in data["output"]

    res = client.post("/api/code/execute", json={"code": "__builtins__.eval('1+1')"})
    assert res.status_code == 200
    data = res.json()
    assert data["exit_code"] == 1
    assert "Erreur de sécurité : Fonction/attribut non autorisé" in data["output"]

    res = client.post("/api/code/execute", json={"code": "print('hello')"})
    assert res.status_code == 200
    data = res.json()
    assert data["exit_code"] == 0
    assert "hello" in data["output"]
