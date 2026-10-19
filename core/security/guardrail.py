import ast
import re
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
    def evaluate_command(cls, command: str, policy: SafetyPolicy) -> tuple[bool, str]:
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


class PythonASTGuardrail(ast.NodeVisitor):
    def __init__(self):
        self.dangerous_imports = {"os", "sys", "subprocess"}
        self.dangerous_functions = {"eval", "exec", "getattr", "__import__"}
        self.errors = []

    def visit_Import(self, node):
        for alias in node.names:
            if alias.name.split(".")[0] in self.dangerous_imports:
                self.errors.append(f"Import dangereux bloqué : {alias.name}")
        self.generic_visit(node)

    def visit_ImportFrom(self, node):
        if node.module and node.module.split(".")[0] in self.dangerous_imports:
            self.errors.append(f"Import dangereux bloqué : {node.module}")
        self.generic_visit(node)

    def visit_Call(self, node):
        if isinstance(node.func, ast.Name) and node.func.id in self.dangerous_functions:
            self.errors.append(f"Fonction dangereuse bloquée : {node.func.id}")
        self.generic_visit(node)

def analyze_python_code(code: str) -> tuple[bool, str]:
    """Analyse statique du code Python pour bloquer les imports et fonctions dangereux."""
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return False, f"Erreur de syntaxe : {e!s}"

    guard = PythonASTGuardrail()
    guard.visit(tree)
    if guard.errors:
        return False, " | ".join(guard.errors)
    return True, "Code sûr."
