from typing import Dict, Any, List, Optional
import time

class ScheduledJob:
    def __init__(self, job_id: str, name: str, cron_expr: str, agent_task: str):
        self.job_id = job_id
        self.name = name
        self.cron_expr = cron_expr
        self.agent_task = agent_task
        self.last_run: Optional[str] = None
        self.status = "scheduled"

class AgentScheduler:
    """Manages recurring automated jobs, daily briefs, and periodic model benchmarks."""

    def __init__(self):
        self.jobs: Dict[str, ScheduledJob] = {
            "daily_brief": ScheduledJob("daily_brief", "Veille Matinale IA", "0 8 * * *", "Résumer les annonces majeures d'IA des 24 dernières heures"),
            "weekly_benchmark": ScheduledJob("weekly_benchmark", "Benchmark Modèles Hebdomadaire", "0 0 * * 0", "Lancer la suite DeepSeek-Harness sur tous les LLMs configurés")
        }

    def list_jobs(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": j.job_id,
                "name": j.name,
                "cron": j.cron_expr,
                "task": j.agent_task,
                "last_run": j.last_run,
                "status": j.status
            }
            for j in self.jobs.values()
        ]

    def trigger_job(self, job_id: str) -> Dict[str, Any]:
        if job_id not in self.jobs:
            return {"error": f"Job {job_id} introuvable."}
        job = self.jobs[job_id]
        job.last_run = time.strftime("%Y-%m-%d %H:%M:%S")
        job.status = "success"
        return {
            "status": "triggered",
            "job": job.name,
            "executed_at": job.last_run
        }

agent_scheduler = AgentScheduler()
