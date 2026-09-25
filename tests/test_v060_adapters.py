import asyncio
from fastapi.testclient import TestClient

from server.app import app
from core.adapters import (
    GoogleADKAdapter,
    HermesAgentAdapter,
    LangChainAdapter,
    AiriAvatarAdapter,
    OmnigentRouterAdapter
)

client = TestClient(app)

def test_health_v060():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

def test_google_adk_task():
    async def _run():
        adapter = GoogleADKAdapter()
        return await adapter.run_task("Concevoir une architecture distribuée", workflow_mode="sequential")

    result = asyncio.run(_run())
    assert result["status"] == "completed"
    assert "Google ADK 2.0" in result["framework"]
    assert result["steps_count"] == 3
    assert len(result["execution_trace"]) == 3
    assert result["final_output"] != ""

def test_google_adk_delegation():
    async def _run():
        adapter = GoogleADKAdapter()
        return await adapter.run_delegation("Audit global", ["Audit sécurité", "Audit performance"])

    result = asyncio.run(_run())
    assert result["status"] == "completed"
    assert result["subtasks_delegated"] == 2
    assert len(result["delegation_results"]) == 2
    assert result["final_synthesis"] != ""

def test_hermes_agent_reasoning_loop():
    async def _run():
        adapter = HermesAgentAdapter(max_turns=3)
        return await adapter.execute_reasoning_loop("Recherche les actualités et affiche les résultats")

    result = asyncio.run(_run())
    assert result["status"] == "completed"
    assert "NousResearch Hermes-Agent" in result["framework"]
    assert result["total_turns"] >= 1
    assert result["final_answer"] != ""

def test_langchain_adapter_sequential():
    async def _run():
        adapter = LangChainAdapter()
        return await adapter.run_chain("sequential", "Création d'une API FastAPI sécurisée")

    result = asyncio.run(_run())
    assert result["status"] == "completed"
    assert "LangChain" in result["framework"]
    assert len(result["steps"]) == 2
    assert result["final_output"] != ""

def test_langchain_adapter_rag():
    async def _run():
        adapter = LangChainAdapter()
        return await adapter.run_chain("rag", "Comment est structuré le graphe sémantique ?")

    result = asyncio.run(_run())
    assert result["status"] == "completed"
    assert result["chain_type"] == "rag"
    assert len(result["retrieved_documents"]) >= 1

def test_langchain_adapter_map_reduce():
    async def _run():
        adapter = LangChainAdapter()
        return await adapter.run_chain("map_reduce", "Section 1: Microservices. Section 2: MCP Protocol. Section 3: Safe sandbox.")

    result = asyncio.run(_run())
    assert result["status"] == "completed"
    assert len(result["map_summaries"]) == 2

def test_airi_avatar_interaction():
    async def _run():
        adapter = AiriAvatarAdapter(personality="airi_default")
        return await adapter.interact("Bonjour Airi ! Comment vas-tu aujourd'hui ?")

    result = asyncio.run(_run())
    assert result["status"] == "success"
    assert "Airi" in result["framework"]
    assert result["character"]["name"] == "Airi"
    assert "state" in result["emotion"]
    assert result["emotion"]["expression_preset"] != ""
    assert result["visemes_count"] > 0
    assert len(result["visemes_timeline"]) > 0

def test_omnigent_router():
    adapter = OmnigentRouterAdapter()
    
    # Test query analysis
    analysis_code = adapter.analyze_query("def optimize_query(sql): return execute(sql)")
    assert "code" in analysis_code["detected_modalities"]
    assert "software_engineering" in analysis_code["detected_domains"]

    analysis_vision = adapter.analyze_query("Analyse cette image et décris le graphique", has_media=True)
    assert "vision" in analysis_vision["detected_modalities"]
    assert "gemini" in analysis_vision["route_decision"]["primary_model"]

    # Test route and execute
    async def _run():
        return await adapter.route_and_execute("Calcule l'optimisation mathématique pour ce réseau de neurones")

    res = asyncio.run(_run())
    assert res["status"] == "completed"
    assert "Omnigent" in res["framework"]
    assert res["result"] != ""

def test_api_adk_endpoint():
    res = client.post("/api/adk/run", json={"task": "Vérifier la conformité de l'API", "workflow_mode": "sequential"})
    assert res.status_code == 200
    assert res.json()["status"] == "completed"

def test_api_hermes_endpoint():
    res = client.post("/api/hermes/execute", json={"task": "Analyser la topologie des microservices"})
    assert res.status_code == 200
    assert res.json()["status"] == "completed"

def test_api_langchain_endpoint():
    res = client.post("/api/langchain/chain", json={"chain_type": "sequential", "input_data": "Déployer un cluster Kubernetes"})
    assert res.status_code == 200
    assert res.json()["status"] == "completed"

def test_api_airi_chat_endpoint():
    res = client.post("/api/airi/chat", json={"message": "Raconte-moi une anecdote sur l'IA", "personality": "cyber_tech"})
    assert res.status_code == 200
    assert res.json()["status"] == "success"

def test_api_airi_personalities_endpoint():
    res = client.get("/api/airi/personalities")
    assert res.status_code == 200
    assert "airi_default" in res.json()["personalities"]

def test_api_omnigent_route_endpoint():
    res = client.post("/api/omnigent/route", json={"prompt": "Vérifie les types TypeScript et compile le frontend", "execute": True})
    assert res.status_code == 200
    assert res.json()["status"] == "completed"
