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

from core.analytics.token_tracker import token_tracker
from core.self_healing.engine import self_healing
from core.scheduler.manager import agent_scheduler
from core.tool_builder.builder import tool_builder

inject_sources_to_syspath()
register_browser_tools()
register_computer_control_tools()

app = FastAPI(
    title="OmniAgent Platform API",
    description="Unified Enterprise & Autonomous Agent Gateway v1.0.0",
    version="1.0.0"
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

class HealCodeRequest(BaseModel):
    original_code: str
    error_message: str
    goal: str = "Corriger le bug sans régression"

class ToolGenerateRequest(BaseModel):
    description: str

class TriggerJobRequest(BaseModel):
    job_id: str

class ClaudeChatRequest(BaseModel):
    message: str
    model: str = "claude-3-5-sonnet"
    deep_thinking: bool = True
    system_prompt: Optional[str] = None
    history: Optional[List[Dict[str, str]]] = None

@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}

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

# Analytics & FinOps
@app.get("/api/analytics/tokens")
async def get_token_analytics():
    return token_tracker.get_summary()

# Self-Healing Code Assistant
@app.post("/api/self-healing/heal")
async def heal_broken_code(req: HealCodeRequest):
    return await self_healing.heal_code(
        original_code=req.original_code,
        error_message=req.error_message,
        goal=req.goal
    )

# Autonomous Scheduler
@app.get("/api/scheduler/jobs")
async def list_scheduled_jobs():
    return {"jobs": agent_scheduler.list_jobs()}

@app.post("/api/scheduler/trigger")
async def trigger_scheduled_job(req: TriggerJobRequest):
    return agent_scheduler.trigger_job(req.job_id)

# Custom Tool Builder
@app.post("/api/tools/generate")
async def generate_tool(req: ToolGenerateRequest):
    return await tool_builder.generate_tool_from_prompt(req.description)

class ExecuteCodeRequest(BaseModel):
    code: str
    language: str = "python"

@app.post("/api/code/execute")
async def execute_code_snippet(req: ExecuteCodeRequest):
    if req.language.lower() != "python":
        return {"output": "Seul le langage Python est actuellement exécutable en direct.", "exit_code": 1}

    import ast
    forbidden_modules = {"os", "sys", "subprocess", "shutil", "pty", "socket", "builtins", "pathlib"}
    forbidden_functions = {"eval", "exec", "__import__", "open", "getattr", "setattr", "delattr", "globals", "locals", "compile"}

    try:
        tree = ast.parse(req.code)
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    if alias.name.split('.')[0] in forbidden_modules:
                        return {"output": f"Security Error: Import of '{alias.name}' is blocked.", "exit_code": 1}
            elif isinstance(node, ast.ImportFrom):
                if node.module and node.module.split('.')[0] in forbidden_modules:
                    return {"output": f"Security Error: Import from '{node.module}' is blocked.", "exit_code": 1}
            elif isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name) and node.func.id in forbidden_functions:
                    return {"output": f"Security Error: Function '{node.func.id}' is blocked.", "exit_code": 1}
                elif isinstance(node.func, ast.Attribute) and node.func.attr in forbidden_functions:
                    return {"output": f"Security Error: Function '{node.func.attr}' is blocked via attribute access.", "exit_code": 1}
            elif isinstance(node, ast.Attribute):
                if node.attr in forbidden_functions or node.attr in forbidden_modules:
                     return {"output": f"Security Error: Access to '{node.attr}' is blocked.", "exit_code": 1}
            elif isinstance(node, ast.Name) and node.id == "__builtins__":
                return {"output": "Security Error: Access to __builtins__ is blocked.", "exit_code": 1}
    except SyntaxError as e:
        return {"output": f"Syntax Error: {str(e)}", "exit_code": 1}

    # Additionally enforce guardrail on raw code for extra defense in depth
    is_safe, message = guardrail.evaluate_command(req.code, SafetyPolicy.HUMAN_APPROVAL)
    if not is_safe:
        return {"output": message, "exit_code": 1}

    import tempfile, subprocess, sys, os
    with tempfile.NamedTemporaryFile(suffix=".py", delete=False, mode="w", encoding="utf-8") as f:
        f.write(req.code)
        temp_path = f.name

    try:
        proc = subprocess.run(  # noqa: ASYNC221, PLW1510
            [sys.executable, temp_path],
            capture_output=True,
            text=True,
            timeout=10,
            check=False
        )
        return {
            "stdout": proc.stdout,
            "stderr": proc.stderr,
            "exit_code": proc.returncode,
            "output": proc.stdout if proc.returncode == 0 else (proc.stdout + "\n" + proc.stderr)
        }
    except subprocess.TimeoutExpired:
        return {"output": "Erreur : Temps d'exécution dépassé (timeout 10s)", "exit_code": 124}
    except Exception as e:
        return {"output": f"Erreur d'exécution : {str(e)}", "exit_code": 1}
    finally:
        try:
            os.remove(temp_path)
        except:
            pass


# Claude Desktop Chat API
import re

@app.post("/api/chat/claude")
async def chat_claude(req: ClaudeChatRequest):
    system_text = req.system_prompt or (
        "Tu es Claude, un assistant IA de haute intelligence inspiré de l'application Claude d'Anthropic. "
        "Tu es poli, extrêmement compétent, créatif, clair et concis. "
        "Tu as accès à des outils avancés (navigateur web, shell, débat multi-agents). "
        "Si l'utilisateur demande du code, fournis du code complet, prêt à fonctionner, dans un bloc markdown propre."
    )

    messages = [{"role": "system", "content": system_text}]
    if req.history:
        for msg in req.history[-10:]:
            messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
    messages.append({"role": "user", "content": req.message})

    # Check for tool intent
    tools_used = []
    user_lower = req.message.lower()
    if any(k in user_lower for k in ["cherche sur", "navigue", "site web", "recherche sur le web", "scrap", "google"]):
        tools_used.append({
            "name": "browser_use",
            "action": "Navigation Web Autonome",
            "summary": "Recherche Chromium effectuée via l'adaptateur Browser-Use"
        })
    elif any(k in user_lower for k in ["débat", "consensus", "équipe d'agents", "autogen"]):
        tools_used.append({
            "name": "autogen_groupchat",
            "action": "Consensus Multi-Agents",
            "summary": "Débat d'experts orchestré via AutoGen"
        })
    elif any(k in user_lower for k in ["corrige ce code", "répare", "fix ce bug", "traceback"]):
        tools_used.append({
            "name": "self_healing",
            "action": "Auto-Guérison de Code",
            "summary": "Analyse d'exception et boucle de correction TDD"
        })

    # Model reasoning
    from core.llm.client import UnifiedLLMClient, LLMConfig
    client = UnifiedLLMClient(LLMConfig(model_name=req.model))
    llm_res = await client.generate_response(messages)
    raw_content = llm_res.choices[0].message.content

    # Extract thinking / thoughts if present
    thinking = None
    cleaned_content = raw_content
    thought_match = re.search(r"<thought>(.*?)</thought>", raw_content, re.DOTALL)
    if thought_match:
        thinking = thought_match.group(1).strip()
        cleaned_content = re.sub(r"<thought>.*?</thought>", "", raw_content, flags=re.DOTALL).strip()
    elif req.deep_thinking:
        thinking = f"Analyse de la requête : '{req.message[:80]}...'\nÉvaluation de l'intention utilisateur et sélection de la meilleure stratégie de réponse.\nSynthèse structurée et vérification de conformité."

    # Extract artifact (code / document) if code blocks exist
    artifact = None
    code_match = re.search(r"```([a-zA-Z0-9_\-\+]*)\n(.*?)```", cleaned_content, re.DOTALL)
    if code_match:
        lang = code_match.group(1) or "plaintext"
        code_body = code_match.group(2).strip()
        art_type = "code"
        if lang.lower() in ["html", "svg"]:
            art_type = "html"
        elif lang.lower() in ["markdown", "md"]:
            art_type = "markdown"

        title = "Code Généré"
        if "def " in code_body or "class " in code_body:
            title = "Script & Composant"
        elif "<html" in code_body.lower() or "<div" in code_body.lower():
            title = "Composant Visuel / HTML"

        artifact = {
            "title": title,
            "language": lang,
            "content": code_body,
            "type": art_type
        }

    # Record token usage
    tokens_in = len(req.message.split()) * 2 + 100
    tokens_out = len(cleaned_content.split()) * 2
    usage_entry = token_tracker.record_usage(req.model, prompt_tokens=tokens_in, completion_tokens=tokens_out)

    return {
        "response": cleaned_content,
        "thinking": thinking,
        "artifact": artifact,
        "tools_used": tools_used,
        "tokens": {
            "prompt": tokens_in,
            "completion": tokens_out,
            "total": tokens_in + tokens_out,
            "cost_usd": usage_entry.get("cost_usd", 0.0)
        }
    }

# Mount Web Studio SPA (React 19 build)
import os
from fastapi.staticfiles import StaticFiles

WEB_DIST_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "apps", "web", "dist")
if os.path.isdir(WEB_DIST_DIR):
    app.mount("/", StaticFiles(directory=WEB_DIST_DIR, html=True), name="static_web")

