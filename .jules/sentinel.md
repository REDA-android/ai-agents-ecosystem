## 2024-05-18 - [Fix Command Injection in /api/code/execute]
**Vulnerability:** The `/api/code/execute` endpoint executes Python code in a subprocess without any sandbox or guardrail. This leads to Remote Code Execution (RCE) on the server.
**Learning:** Subprocess execution of untrusted user input without any validation or isolation is highly dangerous.
**Prevention:** Use `core.security.guardrail.SafetyGuardrail.evaluate_command()` or similar to intercept dangerous execution or ensure strict isolation.
