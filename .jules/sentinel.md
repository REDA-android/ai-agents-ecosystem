## 2025-02-28 - Unrestricted Direct Python Code Execution
**Vulnerability:** The `/api/code/execute` endpoint allowed arbitrary Python code execution via `subprocess.run()`, risking remote code execution (RCE) via malicious payloads like `os.system()` or `subprocess.Popen()`.
**Learning:** Shell-based guardrails like `SafetyGuardrail` don't apply when users provide Python source code directly, leaving standard RCE vectors exposed.
**Prevention:** An AST (Abstract Syntax Tree) static analyzer must validate code *before* execution to strictly block dangerous imports (e.g., `os`, `sys`, `subprocess`) and built-in functions (e.g., `eval`, `exec`).
