## 2024-05-24 - Unvalidated Arbitrary Code Execution
**Vulnerability:** The `/api/code/execute` endpoint executes arbitrary Python code without any security validation. This allows RCE (Remote Code Execution) and bypasses the `SafetyGuardrail` system.
**Learning:** Even if an endpoint is designed to execute code (like Python snippets), it must still pass through the application's security guardrails (like `SafetyGuardrail.evaluate_command()`) to prevent command injection and critical system destruction commands.
**Prevention:** Always ensure that endpoints accepting and executing user-provided code or commands invoke `guardrail.evaluate_command()` with the appropriate policy (e.g., `SafetyPolicy.HUMAN_APPROVAL`) before execution.
