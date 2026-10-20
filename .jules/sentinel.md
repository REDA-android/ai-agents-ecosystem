## 2024-05-24 - [Title]
**Vulnerability:** The `/api/code/execute` endpoint executes arbitrary python code directly on the host using `subprocess.run([sys.executable, temp_path])` without any validation.
**Learning:** This is a Remote Code Execution (RCE) vulnerability. While standard shell guardrails exist (`SafetyGuardrail.evaluate_command()`), they are insufficient for python execution as they only protect against shell patterns like `rm -rf`. A Python AST analyzer must be used to block dangerous imports and functions.
**Prevention:** Always validate and restrict the executed code context, particularly for dynamically provided language code snippets, utilizing AST parsing to restrict imported modules and functions (e.g. blocking `os`, `sys`, `subprocess`, `eval`, `exec`).
