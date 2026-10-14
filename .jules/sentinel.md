## 2024-10-14 - Fix Command Injection Vulnerability in Code Execution Endpoint
**Vulnerability:** The `/api/code/execute` endpoint executes raw Python code directly via `subprocess.run` without using the `SafetyGuardrail.evaluate_command()` to check for command injection vulnerabilities (like `os.system("rm -rf /")`).
**Learning:** The `ExecuteCodeRequest` endpoint bypassed the `SafetyGuardrail` which is mandatory for all OS and shell command executions according to the Security Architecture guidelines.
**Prevention:** Always validate execution payloads (especially code meant to be run) using the `SafetyGuardrail.evaluate_command()` method with `SafetyPolicy.HUMAN_APPROVAL` before executing them via subprocess or eval/exec.
