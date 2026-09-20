from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
import json
import asyncio

from core.adapters import inject_sources_to_syspath
from core.adapters.browser_adapter import BrowserUseAdapter
from core.adapters.autogen_adapter import AutoGenAdapter
from core.adapters.goose_ecc_adapter import GooseECCControlAdapter
from core.adapters.catalog_500_adapter import Catalog500AgentsAdapter
from core.orchestration.agent import UnifiedAgent, AgentRole
from core.orchestration.crew import MultiAgentCrew, TeamTask
from core.mcp.hub import mcp_hub
from core.security.guardrail import guardrail, SafetyPolicy
from core.llm.discovery import LocalLLMScanner
from core.memory.graph.store import knowledge_graph
from core.autonomous.runner import OvernightGoalRunner
from plugins.browser.tools import register_browser_tools
from plugins.computer_control.tools import register_computer_control_tools

inject_sources_to_syspath()
register_browser_tools()
register_computer_control_tools()

app = FastAPI(
    title="OmniAgent Platform API",
    description="Unified Enterprise & Autonomous Agent Gateway v0.3.0",
    version="0.3.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GoalRequest(BaseModel):
    goal: str
    max_iterations: int = 10

class CommandValidationRequest(BaseModel):
    command: str
    policy: SafetyPolicy = SafetyPolicy.HUMAN_APPROVAL

class WebTaskRequest(BaseModel):
    task: str
    headless: bool = True

class AutoGenChatRequest(BaseModel):
    topic: str
    rounds: int = 3
    roles: Optional[List[str]] = None

class DevTaskRequest(BaseModel):
    instruction: str

class RunAgentRequest(BaseModel):
    agent_name: str = "OmniAssistant"
    role: AgentRole = AgentRole.ORCHESTRATOR
    system_prompt: str = "You are a helpful AI assistant."
    prompt: str

class RunTeamRequest(BaseModel):
    team_name: str = "DevOpsSquad"
    task: str

@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "0.3.0"}

@app.get("/api/tools")
async def get_tools():
    return {"tools": mcp_hub.list_tools()}

@app.get("/api/llm/discover")
async def discover_local_llms():
    scanner = LocalLLMScanner()
    models = await scanner.scan_ollama_models()
    return {"models": models}

@app.get("/api/memory/graph")
async def get_memory_graph():
    return knowledge_graph.export_graph()

@app.post("/api/security/validate")
async def validate_command(req: CommandValidationRequest):
    allowed, message = guardrail.evaluate_command(req.command, req.policy)
    return {"allowed": allowed, "message": message}

@app.post("/api/goal/start")
async def start_autonomous_goal(req: GoalRequest):
    runner = OvernightGoalRunner(req.goal, max_iterations=req.max_iterations)
    result = await runner.start()
    return result

@app.post("/api/browser/run")
async def run_browser(req: WebTaskRequest):
    adapter = BrowserUseAdapter(headless=req.headless)
    return await adapter.run_web_task(req.task)

@app.post("/api/autogen/chat")
async def run_autogen(req: AutoGenChatRequest):
    adapter = AutoGenAdapter()
    return await adapter.run_conversational_group_chat(req.topic, rounds=req.rounds, roles=req.roles)

@app.post("/api/dev/execute")
async def run_goose_ecc(req: DevTaskRequest):
    adapter = GooseECCControlAdapter()
    return await adapter.execute_dev_task(req.instruction)

@app.get("/api/blueprints")
async def list_blueprints():
    return {"blueprints": Catalog500AgentsAdapter.list_available_blueprints()}

@app.get("/api/blueprints/{agent_id}")
async def get_blueprint(agent_id: str):
    return Catalog500AgentsAdapter.load_blueprint_code(agent_id)

@app.post("/api/agents/run")
async def run_agent(req: RunAgentRequest):
    agent = UnifiedAgent(name=req.agent_name, role=req.role, system_prompt=req.system_prompt)
    return await agent.step(req.prompt)

@app.post("/api/teams/run")
async def run_team(req: RunTeamRequest):
    researcher = UnifiedAgent("WebResearcher", AgentRole.RESEARCHER, "Recherche et synthèse.")
    coder = UnifiedAgent("LeadDeveloper", AgentRole.CODER, "Génération de code propre et testé.")
    crew = MultiAgentCrew(req.team_name, [researcher, coder])
    return await crew.execute_task(TeamTask(task_description=req.task))

# Server-Sent Events (SSE) stream for live agent thought events
@app.get("/api/events/sse")
async def sse_stream():
    async def event_generator():
        for i in range(5):
            await asyncio.sleep(0.5)
            yield f"data: {json.dumps({'event': 'agent_heartbeat', 'step': i + 1})}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.websocket("/ws/events")
async def websocket_events(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(json.dumps({"event": "ack", "data": data}))
    except WebSocketDisconnect:
        pass
