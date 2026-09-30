## 2026-09-30 - [Missing Guardrail in Computer Control Tools]
**Vulnerability:** MCP tools (`plugins/computer_control/tools.py`) were directly instantiating `asyncio.create_subprocess_shell` without validating the command string against the enterprise `SafetyGuardrail`.
**Learning:** Even though API endpoints (like `/api/security/validate`) check the guardrail, backend MCP tool definitions that agents execute must ALSO incorporate the guardrail natively to prevent autonomous agents from bypassing API-level protections.
**Prevention:** Always integrate `core.security.guardrail.evaluate_command()` directly into execution sinks like subprocess, eval, or exec wrappers within tool plugins.
