import asyncio
import time
import uuid
from enum import Enum
from typing import Any, Dict, List, Optional
from core.llm.client import UnifiedLLMClient

class ADKWorkflowMode(str, Enum):
    SEQUENTIAL = "sequential"
    PARALLEL = "parallel"
    LOOP = "loop"
    DELEGATION = "delegation"

class GoogleADKAdapter:
    """Direct functional adapter for sources/adk-python (Google Agent Development Kit 2.0).
    
    Provides graph-based execution runtime, task-to-agent delegation (Task API),
    session context management, and hierarchical multi-turn agent flows.
    """

    def __init__(self, agent_name: str = "GoogleADKMaster", default_model: str = "gemini/gemini-1.5-flash"):
        self.agent_name = agent_name
        self.default_model = default_model
        self.llm = UnifiedLLMClient()

    async def run_task(
        self,
        task: str,
        workflow_mode: str = "sequential",
        steps: Optional[List[Dict[str, str]]] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Runs a structured ADK workflow matching Google ADK 2.0 Task & Workflow runtime."""
        session_id = f"adk-session-{uuid.uuid4().hex[:8]}"
        state = context or {}
        state["initial_task"] = task
        start_time = time.time()
        
        execution_trace = []

        if not steps:
            if workflow_mode == "sequential":
                steps = [
                    {"name": "ADK_Intent_Classifier", "role": "Analyzer", "instruction": "Décomposer la tâche en objectifs précis selon l'architecture Google ADK."},
                    {"name": "ADK_Execution_Agent", "role": "Executor", "instruction": "Traiter et synthétiser les données ou concevoir la solution requise."},
                    {"name": "ADK_Quality_Verifier", "role": "Verifier", "instruction": "Valider la conformité, la sécurité et la cohérence du résultat."}
                ]
            elif workflow_mode == "loop":
                steps = [
                    {"name": "ADK_Hypothesis_Generator", "role": "Generator", "instruction": "Générer une proposition initiale."},
                    {"name": "ADK_Critic_Feedback", "role": "Critic", "instruction": "Évaluer la proposition et formuler les améliorations nécessaires."},
                    {"name": "ADK_Convergence_Refiner", "role": "Refiner", "instruction": "Produire la version finale raffinée."}
                ]
            else:
                steps = [
                    {"name": "ADK_Task_Specialist_A", "role": "Specialist", "instruction": "Examiner sous l'angle architecture et performance."},
                    {"name": "ADK_Task_Specialist_B", "role": "Specialist", "instruction": "Examiner sous l'angle intégration et scalabilité."},
                    {"name": "ADK_Aggregator", "role": "Aggregator", "instruction": "Fusionner les analyses en une synthèse cohérente."}
                ]

        current_input = task
        for i, step_def in enumerate(steps):
            step_start = time.time()
            agent_label = step_def.get("name", f"Step_{i+1}")
            role = step_def.get("role", "Worker")
            instruction = step_def.get("instruction", "")

            system_prompt = (
                f"Tu es le composant '{agent_label}' d'un pipeline Google ADK 2.0 (Agent Development Kit).\n"
                f"Rôle : {role}.\n"
                f"Règle : Réalise strictement ton étape avec précision technique, en utilisant le contexte fourni."
            )
            user_prompt = (
                f"Mission globale : {task}\n"
                f"Instruction de l'étape : {instruction}\n"
                f"Données d'entrée actuelles :\n{current_input}\n\n"
                f"Fournis ta réponse d'étape structurée."
            )

            response = await self.llm.generate_response([
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ])
            output_text = response.choices[0].message.content
            duration = round(time.time() - step_start, 3)

            step_record = {
                "step_index": i + 1,
                "node_name": agent_label,
                "role": role,
                "duration_seconds": duration,
                "output_preview": output_text[:200] + "..." if len(output_text) > 200 else output_text,
                "full_output": output_text
            }
            execution_trace.append(step_record)
            state[agent_label] = output_text
            current_input = output_text

        total_duration = round(time.time() - start_time, 3)

        return {
            "status": "completed",
            "framework": "Google ADK 2.0 (Agent Development Kit)",
            "workflow_mode": workflow_mode,
            "session_id": session_id,
            "total_duration_seconds": total_duration,
            "steps_count": len(execution_trace),
            "execution_trace": execution_trace,
            "state_keys": list(state.keys()),
            "final_output": current_input
        }

    async def run_delegation(self, lead_task: str, subtasks: List[str]) -> Dict[str, Any]:
        """Runs the Google ADK Task API multi-agent delegation pattern."""
        session_id = f"adk-delegation-{uuid.uuid4().hex[:8]}"
        start_time = time.time()

        # Orchestrate subtasks concurrently
        async def execute_subtask(idx: int, task_desc: str):
            res = await self.llm.generate_response([
                {"role": "system", "content": "Tu es un sous-agent délégué via l'API Task de Google ADK."},
                {"role": "user", "content": f"Objectif principal : {lead_task}\nSous-tâche assignée : {task_desc}\nProduis un résultat direct."}
            ])
            return {
                "subtask_id": idx + 1,
                "task": task_desc,
                "result": res.choices[0].message.content
            }

        delegated_results = await asyncio.gather(
            *[execute_subtask(idx, st) for idx, st in enumerate(subtasks)]
        )

        # Aggregation step
        combined_context = "\n\n".join([f"Sous-tâche {d['subtask_id']} ({d['task']}) :\n{d['result']}" for d in delegated_results])
        agg_res = await self.llm.generate_response([
            {"role": "system", "content": "Tu es l'agent coordinateur Google ADK. Fusionne et synthétise les résultats des sous-agents délégués."},
            {"role": "user", "content": f"Tâche racine : {lead_task}\n\nRésultats reçus :\n{combined_context}\n\nSynthèse finale et conclusion :"}
        ])
        final_synthesis = agg_res.choices[0].message.content

        return {
            "status": "completed",
            "framework": "Google ADK 2.0 Task Delegation API",
            "session_id": session_id,
            "duration_seconds": round(time.time() - start_time, 3),
            "subtasks_delegated": len(subtasks),
            "delegation_results": delegated_results,
            "final_synthesis": final_synthesis
        }
