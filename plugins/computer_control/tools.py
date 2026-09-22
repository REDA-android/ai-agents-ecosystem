import asyncio
import subprocess
from typing import Any, Dict
from core.mcp.hub import mcp_hub
from core.security.guardrail import SafetyGuardrail, SafetyPolicy

async def execute_shell_command(command: str, cwd: str = ".") -> Dict[str, Any]:
    """Execute shell command with timeout and safety control (inspired by Goose / ECC)."""

    # 🛡️ Sentinel: Prevent command injection by validating through guardrails
    allowed, message = SafetyGuardrail.evaluate_command(command, SafetyPolicy.HUMAN_APPROVAL)
    if not allowed:
        return {"error": f"Security Policy Violation: {message}"}

    try:
        proc = await asyncio.create_subprocess_shell(
            command,
            cwd=cwd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=30.0)
        return {
            "exit_code": proc.returncode,
            "stdout": stdout.decode("utf-8", errors="replace"),
            "stderr": stderr.decode("utf-8", errors="replace")
        }
    except Exception as e:
        return {"error": str(e)}

def register_computer_control_tools():
    mcp_hub.register_tool(
        name="shell_execute",
        description="Run terminal commands to write code, install packages, or execute scripts safely",
        schema={
            "type": "object",
            "properties": {
                "command": {"type": "string", "description": "The command line string to run"},
                "cwd": {"type": "string", "description": "Working directory", "default": "."}
            },
            "required": ["command"]
        },
        func=execute_shell_command
    )
