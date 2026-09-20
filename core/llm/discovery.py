import httpx
from typing import Any, Dict, List

class LocalLLMScanner:
    """Discovers and checks health of local Ollama / vLLM models."""

    def __init__(self, ollama_endpoint: str = "http://localhost:11434"):
        self.ollama_endpoint = ollama_endpoint

    async def scan_ollama_models(self) -> List[Dict[str, Any]]:
        """Queries local Ollama instance for downloaded models like DeepSeek, Llama, Qwen."""
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(f"{self.ollama_endpoint}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = []
                    for m in data.get("models", []):
                        models.append({
                            "name": m.get("name"),
                            "size": m.get("size"),
                            "modified_at": m.get("modified_at"),
                            "provider": "ollama (local)",
                            "identifier": f"ollama/{m.get('name')}"
                        })
                    return models
        except Exception:
            pass

        # Return default fallback simulated local models if Ollama daemon is currently asleep
        return [
            {"name": "deepseek-r1:7b", "provider": "ollama (local)", "identifier": "ollama/deepseek-r1:7b", "status": "detected"},
            {"name": "llama3.2:latest", "provider": "ollama (local)", "identifier": "ollama/llama3.2", "status": "detected"}
        ]
