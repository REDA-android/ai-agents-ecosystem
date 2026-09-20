from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMSMiddleware
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
import json

from core.orchestration.agent import UnifiedAgent, AgentRole
from core.orchestration.crew import MultiAgentCrew, TeamTask
from core.mcp.hub import mcp_hub
from plugins.browser.tools import register_browser_tools
from plugins.computer_control.tools import register_computer_control_tools

# Register built-in MCP tools
register_browser_tools()
register_computer_control_tools()

app = FastAPI(
    title="OmniAgent Platform API",
    description="Universal API Gateway for AI Agents Orchestration",
    version="0.1.0"
)

app.add_middleware(
    CORSMSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    return {"status": "ok", "version": "0.1.0"}

@app.get("/api/tools")
async def get_tools():
    return {"tools": mcp_hub.list_tools()}

@app.post("/api/agents/run")
async def run_agent(req: RunAgentRequest):
    agent = UnifiedAgent(name=req.agent_name, role=req.role, system_prompt=req.system_prompt)
    result = await agent.step(req.prompt)
    return result

@app.post("/api/teams/run")
async def run_team(req: RunTeamRequest):
    researcher = UnifiedAgent("WebResearcher", AgentRole.RESEARCHER, "Search and summarize findings.")
    coder = UnifiedAgent("LeadDeveloper", AgentRole.CODER, "Write production-ready code based on research.")
    crew = MultiAgentCrew(req.team_name, [researcher, coder])
    result = await crew.execute_task(TeamTask(task_description=req.task))
    return result

@app.websocket("/ws/events")
async def websocket_events(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # Echo or process incoming stream events
            await websocket.send_text(json.dumps({"event": "ack", "data": data}))
    except WebSocketDisconnect:
        pass
