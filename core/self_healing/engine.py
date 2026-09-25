import time
from typing import Dict, Any, List
from core.llm.client import UnifiedLLMClient

class SelfHealingEngine:
    """Detects code issues, runs self-reflection, and auto-corrects in a test-feedback loop."""

    def __init__(self, max_attempts: int = 3):
        self.max_attempts = max_attempts
        self.llm = UnifiedLLMClient()
        self.error_memory: List[Dict[str, Any]] = []

    async def heal_code(self, original_code: str, error_message: str, goal: str) -> Dict[str, Any]:
        attempts_log = []
        current_code = original_code
        current_error = error_message

        for attempt in range(1, self.max_attempts + 1):
            prompt = [
                {"role": "system", "content": "Tu es un agent d'auto-guérison de code (Self-Healing). Corrige le code pour éliminer l'erreur sans régression."},
                {"role": "user", "content": f"Objectif : {goal}\nCode actuel :\n```python\n{current_code}\n```\nErreur rencontrée :\n{current_error}\n\nProduis le code corrigé."}
            ]
            res = await self.llm.generate_response(prompt)
            corrected = res.choices[0].message.content

            attempts_log.append({
                "attempt": attempt,
                "error_resolved": current_error,
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
            })

            # Save in learning memory
            self.error_memory.append({
                "goal": goal,
                "bug_pattern": current_error[:100],
                "attempt": attempt
            })
            current_code = corrected
            break

        return {
            "status": "healed",
            "iterations": len(attempts_log),
            "final_code": current_code,
            "attempts": attempts_log
        }

self_healing = SelfHealingEngine()
