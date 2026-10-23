## 2023-10-23 - Prevent Remote Code Execution (RCE) in code execution endpoint

**Vulnerability:** The `/api/code/execute` endpoint directly executed python code provided by user input using `subprocess.run` without any validation. This allowed an attacker to execute arbitrary OS commands via python's `os`, `sys`, `subprocess` modules, bypassing the shell-based guardrails (which only checked specific shell command strings).
**Learning:** Standard string-based shell guardrails are completely blind to code execution injection (e.g. `import os; os.system('...')`).
**Prevention:** Always use static analysis (e.g., Python AST) to parse and validate user-supplied code, strictly blocking dangerous imports and built-in functions (`eval`, `exec`, `getattr`, `__import__`, `__builtins__`) before passing it to the execution engine. Check both names and attributes.
