## 2024-05-15 - [API Code Execution Vulnerability]
**Vulnerability:** The `/api/code/execute` endpoint executes arbitrary python code inside the server context with `subprocess.run` without prior validation.
**Learning:** This could lead to a severe RCE if a user submits code like `import os; os.system('rm -rf /')` bypassing the frontend restrictions.
**Prevention:** Always use the existing `SafetyGuardrail.evaluate_command` policy for any script passed to an execution endpoint. We should intercept malicious payloads before the execution happens.
