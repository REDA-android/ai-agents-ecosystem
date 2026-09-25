from typing import Dict, Any, List
import time

class TokenCostTracker:
    """Tracks token consumption and financial costs across models and sessions."""

    MODEL_PRICING = {
        "gemini/gemini-1.5-flash": {"prompt_per_1k": 0.000075, "completion_per_1k": 0.0003},
        "gemini/gemini-2.0-flash": {"prompt_per_1k": 0.0001, "completion_per_1k": 0.0004},
        "openai/gpt-4o-mini": {"prompt_per_1k": 0.00015, "completion_per_1k": 0.0006},
        "anthropic/claude-3-5-sonnet": {"prompt_per_1k": 0.003, "completion_per_1k": 0.015},
        "ollama/deepseek-r1:7b": {"prompt_per_1k": 0.0, "completion_per_1k": 0.0},
        "ollama/llama3.2": {"prompt_per_1k": 0.0, "completion_per_1k": 0.0},
    }

    def __init__(self, monthly_budget_limit_usd: float = 50.0):
        self.monthly_budget_limit_usd = monthly_budget_limit_usd
        self.history: List[Dict[str, Any]] = []

    def record_usage(self, model: str, prompt_tokens: int, completion_tokens: int) -> Dict[str, Any]:
        pricing = self.MODEL_PRICING.get(model, {"prompt_per_1k": 0.0001, "completion_per_1k": 0.0004})
        cost = (prompt_tokens / 1000.0) * pricing["prompt_per_1k"] + (completion_tokens / 1000.0) * pricing["completion_per_1k"]

        entry = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "model": model,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": prompt_tokens + completion_tokens,
            "cost_usd": round(cost, 6)
        }
        self.history.append(entry)
        return entry

    def get_summary(self) -> Dict[str, Any]:
        total_tokens = sum(e["total_tokens"] for e in self.history)
        total_cost = sum(e["cost_usd"] for e in self.history)
        return {
            "total_requests": len(self.history),
            "total_tokens": total_tokens,
            "total_cost_usd": round(total_cost, 4),
            "budget_limit_usd": self.monthly_budget_limit_usd,
            "budget_used_percent": round((total_cost / max(self.monthly_budget_limit_usd, 0.01)) * 100, 2),
            "recent_entries": self.history[-10:]
        }

token_tracker = TokenCostTracker()
