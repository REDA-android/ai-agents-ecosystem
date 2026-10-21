## 2024-05-24 - Unsafe Python Execution
**Vulnerability:** The `/api/code/execute` endpoint directly writes user-provided strings into a Python file and executes them via `subprocess.run` without any validation or isolation. Standard shell guardrails don't inspect python code context.
**Learning:** Even though `guardrail.py` has regex filters for shell commands (e.g. `rm -rf`), it doesn't block Python code execution (e.g. `import os; os.system('rm -rf /')`), leading to critical Command Injection / RCE. An AST static analyzer must be implemented to block dangerous Python functions/modules.
**Prevention:** Always validate runtime code dynamically using AST analysis rather than basic regex against terminal inputs, and sandbox executions.
