from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
import json
import asyncio

from core.adapters import (
    inject_sources_to_syspath,
    BrowserUseAdapter,
    AutoGenAdapter,
    GooseECCControlAdapter,
    Catalog500AgentsAdapter,
    GoogleADKAdapter,
    HermesAgentAdapter,
    LangChainAdapter,
    AiriAvatarAdapter,
    OmnigentRouterAdapter,
)
from core.orchestration.agent import UnifiedAgent, AgentRole
from core.orchestration.crew import MultiAgentCrew, TeamTask
from core.workflows.engine import VisualWorkflowEngine, VisualWorkflowDefinition
from core.mcp.hub import mcp_hub
from core.mcp.store import mcp_store
from core.security.guardrail import guardrail, SafetyPolicy
from core.llm.discovery import LocalLLMScanner
from core.memory.graph.store import knowledge_graph
from core.autonomous.runner import OvernightGoalRunner
from core.evaluation.benchmark import DeepSeekHarnessBenchmarker
from plugins.browser.tools import register_browser_tools
from plugins.computer_control.tools import register_computer_control_tools

inject_sources_to_syspath()
register_browser_tools()
register_computer_control_tools()

app = FastAPI(
    title="OmniAgent Platform API",
    description="Unified Enterprise & Autonomous Agent Gateway v0.6.0",
    version="0.6.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class RunWorkflowRequest(BaseModel):
    workflow: VisualWorkflowDefinition
    input_text: str

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

class ToolToggleRequest(BaseModel):
    name: str
    enabled: bool

class BenchmarkRequest(BaseModel):
    model: str = "gemini/gemini-1.5-flash"

class ADKRunRequest(BaseModel):
    task: str
    workflow_mode: str = "sequential"  # "sequential" | "parallel" | "loop" | "delegation"
    subtasks: Optional[List[str]] = None

class HermesExecuteRequest(BaseModel):
    task: str
    tools: Optional[List[str]] = None
    compress_trajectory: bool = True

class LangChainRequest(BaseModel):
    chain_type: str = "sequential"  # "sequential" | "rag" | "tool_calling" | "map_reduce"
    input_data: str

class AiriChatRequest(BaseModel):
    message: str
    personality: str = "airi_default"  # "airi_default" | "cyber_tech" | "sensei"
    voice_enabled: bool = True

class OmnigentRouteRequest(BaseModel):
    prompt: str
    has_media: bool = False
    media_type: Optional[str] = None
    execute: bool = True

@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "0.6.0"}

# Visual Workflow Pipeline Execution
@app.post("/api/workflows/run")
async def run_visual_workflow(req: RunWorkflowRequest):
    engine = VisualWorkflowEngine(req.workflow)
    return await engine.execute(req.input_text)

# MCP Tools & Protocol
@app.get("/api/tools")
async def get_tools():
    return {"tools": mcp_store.list_tools()}

@app.post("/api/tools/toggle")
async def toggle_tool(req: ToolToggleRequest):
    updated = mcp_store.toggle_tool(req.name, req.enabled)
    return {"status": "updated", "tool": updated}

@app.get("/mcp")
async def mcp_external_endpoint():
    return mcp_store.get_mcp_server_manifest()

# Benchmark DeepSeek-Harness
@app.post("/api/benchmark/run")
async def run_benchmark(req: BenchmarkRequest):
    bench = DeepSeekHarnessBenchmarker(model_name=req.model)
    return await bench.run_suite()

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
    return await runner.start()

# Browser-Use Adapter
@app.post("/api/browser/run")
async def run_browser(req: WebTaskRequest):
    adapter = BrowserUseAdapter(headless=req.headless)
    return await adapter.run_web_task(req.task)

# AutoGen Adapter
@app.post("/api/autogen/chat")
async def run_autogen(req: AutoGenChatRequest):
    adapter = AutoGenAdapter()
    return await adapter.run_conversational_group_chat(req.topic, rounds=req.rounds, roles=req.roles)

# Goose & ECC Dev Loop Adapter
@app.post("/api/dev/execute")
async def run_goose_ecc(req: DevTaskRequest):
    adapter = GooseECCControlAdapter()
    return await adapter.execute_dev_task(req.instruction)

# Google ADK-Python Adapter
@app.post("/api/adk/run")
async def run_adk(req: ADKRunRequest):
    adapter = GoogleADKAdapter()
    if req.workflow_mode == "delegation" or req.subtasks:
        subtasks = req.subtasks or [
            "Analyse architecturale et exigences",
            "Implémentation technique et validation",
            "Synthèse finale et documentation"
        ]
        return await adapter.run_delegation(req.task, subtasks)
    return await adapter.run_task(req.task, workflow_mode=req.workflow_mode)

# NousResearch Hermes-Agent Adapter
@app.post("/api/hermes/execute")
async def run_hermes(req: HermesExecuteRequest):
    adapter = HermesAgentAdapter()
    return await adapter.execute_reasoning_loop(
        task=req.task,
        available_tools=req.tools,
        compress_trajectory=req.compress_trajectory
    )

# LangChain Tools & Chains Adapter
@app.post("/api/langchain/chain")
async def run_langchain(req: LangChainRequest):
    adapter = LangChainAdapter()
    return await adapter.run_chain(chain_type=req.chain_type, input_data=req.input_data)

# Airi Conversational Avatar & Audio Adapter
@app.post("/api/airi/chat")
async def chat_airi(req: AiriChatRequest):
    adapter = AiriAvatarAdapter(personality=req.personality)
    return await adapter.interact(user_speech_or_text=req.message, voice_enabled=req.voice_enabled)

@app.get("/api/airi/personalities")
async def get_airi_personalities():
    from core.adapters.airi_adapter import AIRI_PERSONALITIES
    return {"personalities": AIRI_PERSONALITIES}

# Omnigent Multimodal Router Adapter
@app.post("/api/omnigent/route")
async def route_omnigent(req: OmnigentRouteRequest):
    adapter = OmnigentRouterAdapter()
    if req.execute:
        return await adapter.route_and_execute(
            prompt=req.prompt,
            has_media=req.has_media,
            media_type=req.media_type
        )
    return adapter.analyze_query(
        prompt=req.prompt,
        has_media=req.has_media,
        media_type=req.media_type
    )

# 500-AI-Agents Catalog
@app.get("/api/blueprints")
async def list_blueprints():
    return {"blueprints": Catalog500AgentsAdapter.list_available_blueprints()}

@app.get("/api/blueprints/{agent_id}")
async def get_blueprint(agent_id: str):
    return Catalog500AgentsAdapter.load_blueprint_code(agent_id)

# Standard Unified Agent & Crew
@app.post("/api/agents/run")
async def run_agent(req: RunAgentRequest):
    agent = UnifiedAgent(name=req.agent_name, role=req.role, system_prompt=req.system_prompt)
    return await agent.step(req.prompt)

@app.post("/api/teams/run")
async def run_team(req: RunTeamRequest):
    researcher = UnifiedAgent("WebResearcher", AgentRole.RESEARCHER, "Recherche et analyse.")
    coder = UnifiedAgent("LeadDeveloper", AgentRole.CODER, "Implémentation et tests.")
    crew = MultiAgentCrew(req.team_name, [researcher, coder])
    return await crew.execute_task(TeamTask(task_description=req.task))

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
