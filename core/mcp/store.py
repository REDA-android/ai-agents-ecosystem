from typing import Any, Callable, Dict, List, Optional
from pydantic import BaseModel

class MCPTool(BaseModel):
    name: str
    description: str
    enabled: bool = True
    category: str = "general"

class MCPStoreManager:
    """Store for managing internal tool toggles and serving external MCP clients (Cursor/Claude)."""

    def __init__(self):
        self._tools: Dict[str, MCPTool] = {
            "browser_navigate": MCPTool(name="browser_navigate", description="Navigation web autonome (Playwright)", category="web"),
            "shell_execute": MCPTool(name="shell_execute", description="Commandes shell et code (Goose/ECC)", category="terminal"),
            "vector_search": MCPTool(name="vector_search", description="Recherche mémoire ChromaDB", category="memory"),
            "graph_query": MCPTool(name="graph_query", description="Requête de relations Graphify", category="graph")
        }

    def list_tools(self) -> List[MCPTool]:
        return list(self._tools.values())

    def toggle_tool(self, name: str, enabled: bool) -> Optional[MCPTool]:
        if name in self._tools:
            self._tools[name].enabled = enabled
            return self._tools[name]
        return None

    def get_mcp_server_manifest(self) -> Dict[str, Any]:
        """Official MCP manifest exposed to external IDEs."""
        return {
            "server_name": "omniagent-mcp-server",
            "version": "1.0.0",
            "capabilities": {
                "tools": [
                    {"name": t.name, "description": t.description}
                    for t in self._tools.values() if t.enabled
                ]
            }
        }

mcp_store = MCPStoreManager()
