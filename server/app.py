from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
import json

from core.adapters import inject_sources_to_syspath
from core.adapters.browser_adapter import BrowserUseAdapter
from core.adapters.autogen_adapter import AutoGenAdapter
from core.adapters.goose_ecc_adapter import GooseECCControlAdapter
from core.adapters.catalog_500_adapter import Catalog500AgentsAdapter
from core.orchestration.agent import UnifiedAgent, AgentRole
from core.orchestration.crew import MultiAgentCrew, TeamTask
from core.mcp.hub import mcp_hub
from plugins.browser.tools import register_browser_tools
from plugins.computer_control.tools import register_computer_control_tools

# Initialize paths & MCP tools
inject_sources_to_syspath()
register_browser_tools()
register_computer_control_tools()

app = FastAPI(
    title="OmniAgent Platform API",
    description="Universal Functional API Gateway for all 16 AI Agents Ecosystem",
    version="0.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
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

# 1. System Health & Tools
@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "version": "0.2.0",
        "ecosystem": "16 Open-Source Projects Functionally Unified"
    }

@app.get("/api/tools")
async def get_tools():
    return {"tools": mcp_hub.list_tools()}

# 2. Browser-Use Functional Endpoint
@app.post("/api/browser/run")
async def run_browser(req: WebTaskRequest):
    adapter = BrowserUseAdapter(headless=req.headless)
    return await adapter.run_web_task(req.task)

# 3. AutoGen GroupChat Functional Endpoint
@app.post("/api/autogen/chat")
async def run_autogen(req: AutoGenChatRequest):
    adapter = AutoGenAdapter()
    return await adapter.run_conversational_group_chat(req.topic, rounds=req.rounds, roles=req.roles)

# 4. Goose & ECC Developer OS Control Endpoint
@app.post("/api/dev/execute")
async def run_goose_ecc(req: DevTaskRequest):
    adapter = GooseECCControlAdapter()
    return await adapter.execute_dev_task(req.instruction)

# 5. 500 AI Agents Blueprints Catalog Endpoint
@app.get("/api/blueprints")
async def list_blueprints():
    return {"blueprints": Catalog500AgentsAdapter.list_available_blueprints()}

@app.get("/api/blueprints/{agent_id}")
async def get_blueprint(agent_id: str):
    return Catalog500AgentsAdapter.load_blueprint_code(agent_id)

# 6. Core Orchestration Endpoints
@app.post("/api/agents/run")
async def run_agent(req: RunAgentRequest):
    agent = UnifiedAgent(name=req.agent_name, role=req.role, system_prompt=req.system_prompt)
    return await agent.step(req.prompt)

@app.post("/api/teams/run")
async def run_team(req: RunTeamRequest):
    researcher = UnifiedAgent("WebResearcher", AgentRole.RESEARCHER, "Recherche et synthèse de données fiables.")
    coder = UnifiedAgent("LeadDeveloper", AgentRole.CODER, "Génération de code robuste et architecture.")
    crew = MultiAgentCrew(req.team_name, [researcher, coder])
    return await crew.execute_task(TeamTask(task_description=req.task))

# 7. WebSocket Live Streaming
@app.websocket("/ws/events")
async def websocket_events(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(json.dumps({"event": "ack", "data": data}))
    except WebSocketDisconnect:
        pass
