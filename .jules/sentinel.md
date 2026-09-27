## 2025-05-15 - Unvalidated Shell Command Execution
**Vulnerability:** Command injection vulnerability in `plugins/computer_control/tools.py` via `asyncio.create_subprocess_shell`.
**Learning:** Shell commands should be validated through `SafetyGuardrail.evaluate_command()` to prevent unauthorized OS access.
**Prevention:** Always sanitize inputs directly passed to execution engines, especially when implementing MCP tools exposing `execute_shell_command`.