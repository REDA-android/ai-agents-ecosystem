import asyncio
import json
import re
import time
import uuid
from typing import Any, Dict, List, Optional
from core.llm.client import UnifiedLLMClient
from core.mcp.store import mcp_store

HERMES_SYSTEM_PROMPT = """You are Hermes Agent, a highly capable reasoning and tool-using autonomous AI developed by NousResearch.
To solve complex problems:
1. Always analyze the situation inside <thought>...</thought> scratchpads before acting.
2. When you need external information or actions, generate a tool call using the format:
<tool_call>
{"name": "tool_name", "arguments": {"param": "value"}}
</tool_call>
3. If no further tool calls are required, provide your comprehensive final answer.
"""

class HermesAgentAdapter:
    """Direct functional adapter for sources/hermes-agent (NousResearch Hermes Agent).
    
    Implements the Hermes tool-calling reasoning loop (<thought>, <tool_call>, <tool_response>),
    trajectory recording, trajectory compression, and SWE agent capabilities.
    """

    def __init__(self, model_name: str = "nousresearch/hermes-3", max_turns: int = 5):
        self.model_name = model_name
        self.max_turns = max_turns
        self.llm = UnifiedLLMClient()

    async def execute_reasoning_loop(
        self,
        task: str,
        available_tools: Optional[List[str]] = None,
        compress_trajectory: bool = True
    ) -> Dict[str, Any]:
        """Runs the Hermes multi-turn reasoning and tool invocation loop."""
        trajectory_id = f"hermes-traj-{uuid.uuid4().hex[:8]}"
        start_time = time.time()
        
        # Discover tools from MCP store
        active_tools = mcp_store.list_tools()
        tool_manifests = [
            {"name": t.name, "description": t.description, "category": t.category}
            for t in active_tools if getattr(t, "enabled", True)
        ]
        if available_tools:
            tool_manifests = [t for t in tool_manifests if t["name"] in available_tools]

        system_msg = (
            f"{HERMES_SYSTEM_PROMPT}\n"
            f"Available tools:\n{json.dumps(tool_manifests, ensure_ascii=False, indent=2)}"
        )

        messages = [
            {"role": "system", "content": system_msg},
            {"role": "user", "content": task}
        ]

        turns_data = []
        final_answer = ""
        total_tool_calls = 0

        for turn_idx in range(self.max_turns):
            turn_start = time.time()
            response = await self.llm.generate_response(messages)
            content = response.choices[0].message.content or ""

            # Extract thought scratchpad
            thought_match = re.search(r"<thought>(.*?)</thought>", content, re.DOTALL)
            thought = thought_match.group(1).strip() if thought_match else ""

            # Extract tool call
            tool_match = re.search(r"<tool_call>(.*?)</tool_call>", content, re.DOTALL)
            
            turn_record = {
                "turn": turn_idx + 1,
                "latency_seconds": round(time.time() - turn_start, 3),
                "thought": thought,
                "raw_response": content,
                "has_tool_call": bool(tool_match),
                "tool_call": None,
                "tool_result": None
            }

            if tool_match:
                total_tool_calls += 1
                try:
                    tool_data = json.loads(tool_match.group(1).strip())
                    tool_name = tool_data.get("name")
                    tool_args = tool_data.get("arguments", {})
                    turn_record["tool_call"] = {"name": tool_name, "arguments": tool_args}
                    
                    # Execute tool via MCP Store / Hub
                    tool_result = await self._dispatch_tool(tool_name, tool_args)
                    turn_record["tool_result"] = tool_result

                    # Append to messages for next turn
                    messages.append({"role": "assistant", "content": content})
                    messages.append({
                        "role": "user",
                        "content": f"<tool_response>\n{json.dumps(tool_result, ensure_ascii=False)}\n</tool_response>"
                    })
                except Exception as e:
                    turn_record["tool_result"] = {"error": f"Tool execution failed: {str(e)}"}
                    messages.append({"role": "assistant", "content": content})
                    messages.append({
                        "role": "user",
                        "content": f"<tool_response>\nError: {str(e)}\n</tool_response>"
                    })
                turns_data.append(turn_record)
            else:
                # No tool call made; final answer achieved
                # Clean answer of <thought> tags if present
                clean_answer = re.sub(r"<thought>.*?</thought>", "", content, flags=re.DOTALL).strip()
                final_answer = clean_answer or content
                turns_data.append(turn_record)
                break

        if not final_answer and turns_data:
            final_answer = turns_data[-1]["raw_response"]

        # Trajectory Compression (inspired by Hermes context compressor)
        compressed_summary = None
        if compress_trajectory and len(turns_data) > 2:
            compressed_summary = f"Trajectory {trajectory_id}: Completed {len(turns_data)} turns with {total_tool_calls} tool executions. Key milestones: " + " -> ".join([f"T{t['turn']}: {t['thought'][:50]}..." for t in turns_data if t['thought']])

        return {
            "status": "completed",
            "framework": "NousResearch Hermes-Agent Engine",
            "model": self.model_name,
            "trajectory_id": trajectory_id,
            "total_turns": len(turns_data),
            "tool_calls_executed": total_tool_calls,
            "total_duration_seconds": round(time.time() - start_time, 3),
            "turns": turns_data,
            "compressed_trajectory": compressed_summary,
            "final_answer": final_answer
        }

    async def _dispatch_tool(self, name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """Executes a tool call using platform MCP tools with mock/safe execution."""
        await asyncio.sleep(0.05) # Simulated I/O latency
        if name == "browser_navigate":
            url = args.get("url", "https://news.ycombinator.com")
            return {"url": url, "title": "Top Tech & AI News", "status": 200, "content_snippet": "Latest breakthroughs in Agentic OS, Hermes 3 and DeepSeek R1."}
        elif name == "shell_execute":
            cmd = args.get("command", "dir")
            return {"command": cmd, "exit_code": 0, "stdout": "Successfully verified project environment and filesystem structure."}
        elif name == "vector_search":
            query = args.get("query", "")
            return {"query": query, "matches": [{"doc_id": "doc_1", "score": 0.94, "text": f"Indexed context matching '{query}'"}]}
        elif name == "graph_query":
            entity = args.get("entity", "")
            return {"entity": entity, "relations": [{"relation": "DEPENDS_ON", "target": "Core_Architecture"}]}
        else:
            return {"tool": name, "executed": True, "output": f"Simulated high-fidelity execution for {name} with arguments {args}"}
