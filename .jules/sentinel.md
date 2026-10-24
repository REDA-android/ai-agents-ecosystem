## 2023-10-24 - [Fix arbitrary Python code execution vulnerability]
**Vulnerability:** The `/api/code/execute` endpoint was vulnerable to arbitrary Python code execution. Although it validated the language, it blindly passed the user string to `subprocess.run()`.
**Learning:** For endpoints executing arbitrary Python code, standard shell guardrails are insufficient. A Python Abstract Syntax Tree (AST) static analyzer must be implemented to actively block unsafe imports and builtin functions.
**Prevention:** Implement a `SecurityASTVisitor` (or traverse AST using `ast.walk`) to identify and block calls to `os`, `sys`, `subprocess`, `importlib` and unsafe builtins (`eval`, `exec`, etc.) prior to execution.
