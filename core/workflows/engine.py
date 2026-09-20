from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import time
from core.orchestration.agent import UnifiedAgent, AgentRole

class WorkflowNode(BaseModel):
    id: str
    label: str
    role: AgentRole
    system_prompt: str

class WorkflowEdge(BaseModel):
    source: str
    target: str
    condition: Optional[str] = None

class VisualWorkflowDefinition(BaseModel):
    name: str
    nodes: List[WorkflowNode]
    edges: List[WorkflowEdge]

class VisualWorkflowEngine:
    """Executes directed graph workflows defined visually in the Studio."""

    def __init__(self, workflow: VisualWorkflowDefinition):
        self.workflow = workflow
        self.node_map = {n.id: n for n in workflow.nodes}

    async def execute(self, initial_input: str) -> Dict[str, Any]:
        execution_log = []
        current_data = initial_input

        # Execute nodes sequentially following the graph flow
        for node in self.workflow.nodes:
            start_t = time.time()
            agent = UnifiedAgent(node.label, node.role, node.system_prompt)
            step_res = await agent.step(f"Contexte d'entrée :\n{current_data}\n\nExécute ta tâche.")
            duration = round(time.time() - start_t, 2)
            
            output_content = step_res["content"]
            execution_log.append({
                "node_id": node.id,
                "node_label": node.label,
                "role": node.role,
                "duration_seconds": duration,
                "output": output_content
            })
            current_data = output_content

        return {
            "status": "completed",
            "workflow_name": self.workflow.name,
            "total_nodes_executed": len(execution_log),
            "final_result": current_data,
            "execution_steps": execution_log
        }
