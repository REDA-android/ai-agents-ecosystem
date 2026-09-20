from typing import Any, Callable, Dict, List, Optional
from pydantic import BaseModel

class ToolDefinition(BaseModel):
    name: str
    description: str
    input_schema: Dict[str, Any]

class MCPHub:
    """Model Context Protocol (MCP) Client & Registry for universal agent tools."""

    def __init__(self):
        self._registered_tools: Dict[str, Callable] = {}
        self._tool_schemas: Dict[str, ToolDefinition] = {}

    def register_tool(self, name: str, description: str, schema: Dict[str, Any], func: Callable):
        self._registered_tools[name] = func
        self._tool_schemas[name] = ToolDefinition(name=name, description=description, input_schema=schema)

    def list_tools(self) -> List[ToolDefinition]:
        return list(self._tool_schemas.values())

    async def execute_tool(self, name: str, arguments: Dict[str, Any]) -> Any:
        if name not in self._registered_tools:
            raise ValueError(f"Tool '{name}' is not registered in MCP Hub.")
        func = self._registered_tools[name]
        try:
            import inspect
            if inspect.iscoroutinefunction(func):
                return await func(**arguments)
            return func(**arguments)
        except Exception as e:
            return {"error": f"Execution failed for tool '{name}': {str(e)}"}

# Global MCP Hub instance
mcp_hub = MCPHub()
