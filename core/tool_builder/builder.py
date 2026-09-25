from typing import Dict, Any, List
from core.llm.client import UnifiedLLMClient
from core.mcp.store import mcp_store, MCPTool

class ToolBuilderEngine:
    """Generates and registers custom MCP tools via visual form or natural language AI prompt."""

    def __init__(self):
        self.llm = UnifiedLLMClient()

    async def generate_tool_from_prompt(self, description_prompt: str) -> Dict[str, Any]:
        prompt = [
            {"role": "system", "content": "Tu es un ingénieur expert MCP (Model Context Protocol). À partir d'une description, génère un outil Python prêt à l'emploi. Réponds avec un JSON contenant 'name', 'description', 'category', 'python_code'."},
            {"role": "user", "content": f"Besoin outil : {description_prompt}"}
        ]
        res = await self.llm.generate_response(prompt)
        content = res.choices[0].message.content

        tool_name = "custom_tool_" + str(len(mcp_store.list_tools()) + 1)
        new_tool = MCPTool(
            name=tool_name,
            description=description_prompt[:80],
            enabled=True,
            category="custom"
        )
        mcp_store._tools[tool_name] = new_tool

        return {
            "status": "created",
            "tool_name": tool_name,
            "generated_spec": content,
            "active_in_mcp_hub": True
        }

tool_builder = ToolBuilderEngine()
