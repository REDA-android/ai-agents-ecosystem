## 2024-10-02 - Sentinel Security Fix

**Vulnerability:** Found a command injection vulnerability in `plugins/computer_control/tools.py` where `asyncio.create_subprocess_shell` was directly executing user input via `shell_execute` tool without passing through `SafetyGuardrail`.
**Learning:** Shell subprocess execution can trivially expose underlying system if user commands are untrusted. Any execution of `asyncio.create_subprocess_shell` or `subprocess.run(..., shell=True)` requires scrutiny.
**Prevention:** Always evaluate shell commands using `SafetyGuardrail.evaluate_command(command, SafetyPolicy.HUMAN_APPROVAL)` prior to executing them using shell mode.
