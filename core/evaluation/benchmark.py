import time
from typing import Any, Dict, List
from core.llm.client import UnifiedLLMClient

class DeepSeekHarnessBenchmarker:
    """Benchmark suite inspired by sources/deepseek-harness to test agents and models."""

    BENCHMARK_SUITE = [
        {
            "id": "code_generation",
            "name": "Génération d'Algorithme Python",
            "prompt": "Écris une fonction Python optimisée pour calculer les nombres premiers jusqu'à N avec le crible d'Ératosthène.",
            "criteria": "def sieve"
        },
        {
            "id": "multi_agent_consensus",
            "name": "Résolution de Conflits Multi-Agents",
            "prompt": "Propose une architecture microservice résiliente avec fallback Redis et Kafka.",
            "criteria": "kafka"
        },
        {
            "id": "json_tool_calling",
            "name": "Précision d'Appel d'Outils (Tool Calling)",
            "prompt": "Retourne uniquement un JSON valide avec les clés 'action' et 'params'.",
            "criteria": "action"
        }
    ]

    def __init__(self, model_name: str = "gemini/gemini-1.5-flash"):
        self.model_name = model_name
        self.llm = UnifiedLLMClient()

    async def run_suite(self) -> Dict[str, Any]:
        results = []
        total_time = 0.0

        for test in self.BENCHMARK_SUITE:
            start_t = time.time()
            prompt = [
                {"role": "system", "content": "Tu es un modèle en cours d'évaluation par le benchmark DeepSeek-Harness."},
                {"role": "user", "content": test["prompt"]}
            ]
            try:
                res = await self.llm.generate_response(prompt)
                duration = round(time.time() - start_t, 2)
                total_time += duration
                content = res.choices[0].message.content
                passed = test["criteria"].lower() in content.lower()

                results.append({
                    "test_id": test["id"],
                    "test_name": test["name"],
                    "passed": passed,
                    "latency_seconds": duration,
                    "score": 100 if passed else 40
                })
            except Exception as e:
                results.append({
                    "test_id": test["id"],
                    "test_name": test["name"],
                    "passed": False,
                    "latency_seconds": 0.0,
                    "score": 0,
                    "error": str(e)
                })

        avg_score = round(sum(r["score"] for r in results) / len(results), 1) if results else 0
        return {
            "model_tested": self.model_name,
            "overall_score": f"{avg_score}%",
            "total_latency_seconds": round(total_time, 2),
            "tests_run": len(results),
            "details": results
        }
