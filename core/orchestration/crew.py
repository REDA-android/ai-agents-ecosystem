import asyncio
from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from core.orchestration.agent import UnifiedAgent, AgentRole

class TeamTask(BaseModel):
    task_description: str
    context: Optional[Dict[str, Any]] = None

class MultiAgentCrew:
    """Orchestration team combining multiple specialized agents to complete complex goals."""

    def __init__(self, name: str, agents: List[UnifiedAgent]):
        self.name = name
        self.agents = agents

    async def execute_task(self, task: TeamTask) -> Dict[str, Any]:
        results = []
        current_input = task.task_description

        for agent in self.agents:
            agent_result = await agent.step(current_input)
            results.append(agent_result)
            current_input = f"Previous agent ({agent.state.name}) output:\n{agent_result['content']}\n\nPlease proceed with your specialized role."

        return {
            "team": self.name,
            "final_output": results[-1]["content"] if results else "",
            "execution_steps": results
        }
