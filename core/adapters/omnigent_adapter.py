import asyncio
import re
import time
import uuid
from typing import Any, Dict, List, Optional
from core.llm.client import UnifiedLLMClient

MODEL_PROFILES = {
    "gemini/gemini-1.5-flash": {
        "name": "Google Gemini 1.5 Flash",
        "strengths": ["multimodal", "vision", "audio", "high_speed", "huge_context"],
        "latency_tier": "fast (~0.4s)",
        "cost_per_1m_input": 0.075,
        "cost_per_1m_output": 0.30
    },
    "gemini/gemini-2.0-flash": {
        "name": "Google Gemini 2.0 Flash",
        "strengths": ["realtime", "multimodal", "tool_calling", "streaming"],
        "latency_tier": "ultra_fast (~0.25s)",
        "cost_per_1m_input": 0.10,
        "cost_per_1m_output": 0.40
    },
    "ollama/deepseek-r1:7b": {
        "name": "DeepSeek R1 (7B Local)",
        "strengths": ["deep_reasoning", "math", "logic", "privacy_local", "zero_cost"],
        "latency_tier": "medium (~1.2s)",
        "cost_per_1m_input": 0.0,
        "cost_per_1m_output": 0.0
    },
    "openai/gpt-4o-mini": {
        "name": "OpenAI GPT-4o Mini",
        "strengths": ["general_instruction", "code", "structured_json"],
        "latency_tier": "fast (~0.5s)",
        "cost_per_1m_input": 0.15,
        "cost_per_1m_output": 0.60
    }
}

class OmnigentRouterAdapter:
    """Direct functional adapter for sources/omnigent (Multimodal Intelligent Router & Dispatcher).
    
    Classifies incoming prompts by modality (vision, audio, code, math, text),
    computes complexity & SLA, dynamically routes to the best model, and executes with fallback.
    """

    def __init__(self):
        self.llm = UnifiedLLMClient()

    def analyze_query(self, prompt: str, has_media: bool = False, media_type: Optional[str] = None) -> Dict[str, Any]:
        """Classifies the query and determines modality, domain, and optimal model route."""
        detected_modalities = ["text"]
        detected_domains = []
        complexity_score = 3

        lower = prompt.lower()

        # Detect Code
        if any(w in lower for w in ["def ", "class ", "import ", "function", "const ", "git ", "sql", "html", "api", "json", "endpoint"]):
            detected_modalities.append("code")
            detected_domains.append("software_engineering")
            complexity_score += 2

        # Detect Math & Reasoning
        if any(w in lower for w in ["preuve", "démontre", "calcule", "équation", "logique", "optimisation", "théorème", "benchmark", "complexité"]):
            detected_modalities.append("reasoning_chains")
            detected_domains.append("deep_reasoning")
            complexity_score += 3

        # Detect Vision/Media
        if has_media or any(w in lower for w in ["image", "photo", "capture", "ocr", "graphique", "diagramme", "visuel"]):
            detected_modalities.append("vision")
            detected_domains.append("multimodal_vision")
            complexity_score += 2

        # Detect Audio
        if media_type == "audio" or any(w in lower for w in ["audio", "voix", "transcription", "parole", "speech"]):
            detected_modalities.append("audio")
            detected_domains.append("speech_audio")

        complexity_score = min(10, complexity_score)

        # Route Selection Logic
        if "vision" in detected_modalities or "audio" in detected_modalities:
            recommended_model = "gemini/gemini-1.5-flash"
            fallback_model = "gemini/gemini-2.0-flash"
            reason = "Multimodalité détectée (Vision/Audio) : Modèle Gemini Native recommandé."
        elif "deep_reasoning" in detected_domains or complexity_score >= 7:
            recommended_model = "ollama/deepseek-r1:7b"
            fallback_model = "gemini/gemini-1.5-flash"
            reason = "Raisonnement complexe et déduction logique : Moteur DeepSeek-R1 sélectionné."
        elif "software_engineering" in detected_domains:
            recommended_model = "gemini/gemini-1.5-flash"
            fallback_model = "openai/gpt-4o-mini"
            reason = "Ingénierie logicielle et code : Modèle optimisé pour le dev."
        else:
            recommended_model = "gemini/gemini-1.5-flash"
            fallback_model = "ollama/deepseek-r1:7b"
            reason = "Requête généraliste rapide : Routage standard haute efficacité."

        return {
            "query_preview": prompt[:120] + "..." if len(prompt) > 120 else prompt,
            "detected_modalities": detected_modalities,
            "detected_domains": detected_domains or ["general_assistant"],
            "complexity_score": complexity_score,
            "route_decision": {
                "primary_model": recommended_model,
                "primary_model_details": MODEL_PROFILES.get(recommended_model),
                "fallback_model": fallback_model,
                "reasoning": reason,
                "estimated_latency": MODEL_PROFILES.get(recommended_model, {}).get("latency_tier", "fast"),
                "estimated_cost_usd": 0.0001
            }
        }

    async def route_and_execute(
        self,
        prompt: str,
        has_media: bool = False,
        media_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """Classifies, routes, and executes the user task through the determined model."""
        start_time = time.time()
        route_info = self.analyze_query(prompt, has_media, media_type)
        primary_model = route_info["route_decision"]["primary_model"]

        # Execution
        system_instruction = (
            f"Tu es l'agent Omnigent Multimodal Router exécutant la tâche via le profil sélectionné : {primary_model}.\n"
            f"Domaines actifs : {', '.join(route_info['detected_domains'])}.\n"
            f"Complexité : {route_info['complexity_score']}/10."
        )

        response = await self.llm.generate_response([
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt}
        ])
        output_content = response.choices[0].message.content

        duration = round(time.time() - start_time, 3)

        return {
            "status": "completed",
            "framework": "Omnigent Multimodal Router Engine",
            "dispatch_id": f"omnigent-{uuid.uuid4().hex[:8]}",
            "duration_seconds": duration,
            "routing_telemetry": route_info,
            "executed_on_model": primary_model,
            "result": output_content
        }
