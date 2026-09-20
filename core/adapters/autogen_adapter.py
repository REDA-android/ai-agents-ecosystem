from typing import Any, Dict, List, Optional
from core.llm.client import UnifiedLLMClient

class AutoGenAdapter:
    """Direct functional adapter for sources/autogen multi-agent conversational patterns."""

    def __init__(self, team_name: str = "AutoGenTeam"):
        self.team_name = team_name
        self.llm = UnifiedLLMClient()

    async def run_conversational_group_chat(
        self,
        task: str,
        rounds: int = 3,
        roles: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Runs a multi-agent debate and consensus loop inspired by AutoGen GroupChat."""
        assigned_roles = roles or ["Assistant_Chercheur", "Ingenieur_Architecte", "Critique_Qualite"]
        chat_history = []
        current_context = f"Mission principale: {task}\n"

        for r in range(rounds):
            speaker = assigned_roles[r % len(assigned_roles)]
            prompt = [
                {"role": "system", "content": f"Tu es l'agent {speaker}. Participe à ce débat AutoGen. Fais avancer la tâche avec ta spécialité."},
                {"role": "user", "content": f"Historique des échanges:\n{current_context}\n\nDonne ta contribution concise et précise."}
            ]
            response = await self.llm.generate_response(prompt)
            reply = response.choices[0].message.content
            chat_history.append({"speaker": speaker, "round": r + 1, "message": reply})
            current_context += f"[{speaker}]: {reply}\n"

        return {
            "status": "success",
            "framework": "AutoGen GroupChat Engine",
            "rounds_completed": rounds,
            "transcript": chat_history,
            "consensus": chat_history[-1]["message"] if chat_history else ""
        }
