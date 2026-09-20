import asyncio
import time
from typing import Any, Dict, List, Optional
from core.orchestration.agent import UnifiedAgent, AgentRole

class OvernightGoalRunner:
    """Long-running autonomous agent worker (/goal mode) with auto-retry and session report."""

    def __init__(self, goal_description: str, max_iterations: int = 20):
        self.goal_description = goal_description
        self.max_iterations = max_iterations
        self.history: List[Dict[str, Any]] = []
        self.is_active = False

    async def start(self) -> Dict[str, Any]:
        self.is_active = True
        agent = UnifiedAgent("AutonomousGoalWorker", AgentRole.ORCHESTRATOR, "Exécute en boucle jusqu'à accomplir l'objectif sans s'arrêter.")
        
        iteration = 0
        start_time = time.time()

        while self.is_active and iteration < self.max_iterations:
            iteration += 1
            step_res = await agent.step(
                f"Objectif global: {self.goal_description}. Itération {iteration}/{self.max_iterations}. Fais l'étape suivante et indique si c'est terminé."
            )
            self.history.append({
                "iteration": iteration,
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                "result": step_res["content"]
            })

            # Check if goal self-reports completion
            if "GOAL_COMPLETE" in step_res["content"] or "OBJECTIF_ATTEINT" in step_res["content"]:
                break
            await asyncio.sleep(1.0)

        duration = round(time.time() - start_time, 2)
        return {
            "status": "completed",
            "goal": self.goal_description,
            "total_iterations": iteration,
            "duration_seconds": duration,
            "summary_report": f"Mission autonome achevée après {iteration} itérations ({duration}s).",
            "log": self.history
        }

    def stop(self):
        self.is_active = False
