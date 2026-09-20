import re
from typing import Dict, Any, Tuple
from enum import Enum

class SafetyPolicy(str, Enum):
    HUMAN_APPROVAL = "human_approval"
    DOCKER_SANDBOX = "docker_sandbox"
    AUTONOMOUS_AUDITED = "autonomous_audited"

class SafetyGuardrail:
    """Enforces safety policies on terminal, filesystem and OS operations."""

    CRITICAL_PATTERNS = [
        r"\brm\s+-[rf]*\s+[/~]",
        r"\bformat\s+[a-zA-Z]:",
        r"\bdel\s+/[sfq]",
        r"\bdrop\s+database\b",
        r"\bdrop\s+table\b",
        r"\btruncate\s+table\b",
        r"\bcurl\b.*\|\s*(bash|sh|powershell)\b",
        r"\bgit\s+push\s+--force\b"
    ]

    @classmethod
    def evaluate_command(cls, command: str, policy: SafetyPolicy) -> Tuple[bool, str]:
        """Evaluates whether a command requires human approval or sandbox execution."""
        for pattern in cls.CRITICAL_PATTERNS:
            if re.search(pattern, command, re.IGNORECASE):
                if policy == SafetyPolicy.HUMAN_APPROVAL:
                    return False, f"Action critique interceptée par les garde-fous : '{command}'. Approbation humaine requise."
                elif policy == SafetyPolicy.DOCKER_SANDBOX:
                    return True, "Commande critique routée vers la Sandbox Docker isolée."
        return True, "Commande autorisée."

# Global guardrail
guardrail = SafetyGuardrail()
