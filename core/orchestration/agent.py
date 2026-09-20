from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import uuid
from core.llm.client import UnifiedLLMClient, LLMConfig
from core.mcp.hub import mcp_hub

class AgentRole(str, Enum):
    RESEARCHER = "researcher"
    CODER = "coder"
    ORCHESTRATOR = "orchestrator"
    BROWSER_NAVIGATOR = "browser_navigator"
    REVIEWER = "reviewer"

class AgentState(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    role: AgentRole
    system_prompt: str
    memory: List[Dict[str, str]] = Field(default_factory=list)

class UnifiedAgent:
    """Core autonomous agent equipped with Multi-LLM reasoning and MCP tools."""

    def __init__(self, name: str, role: AgentRole, system_prompt: str, llm_config: Optional[LLMConfig] = None):
        self.state = AgentState(name=name, role=role, system_prompt=system_prompt)
        self.llm = UnifiedLLMClient(llm_config)

    async def step(self, user_input: str) -> Dict[str, Any]:
        messages = [{"role": "system", "content": self.state.system_prompt}]
        messages.extend(self.state.memory)
        messages.append({"role": "user", "content": user_input})

        response = await self.llm.generate_response(messages)
        content = response.choices[0].message.content

        # Update memory
        self.state.memory.append({"role": "user", "content": user_input})
        self.state.memory.append({"role": "assistant", "content": content})

        return {
            "agent": self.state.name,
            "role": self.state.role,
            "content": content
        }
