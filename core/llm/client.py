from typing import Any, AsyncGenerator, Dict, List, Optional
import os
from pydantic import BaseModel, Field

class LLMConfig(BaseModel):
    model_name: str = Field(default="gemini/gemini-1.5-flash", description="LiteLLM model identifier")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(default=4096)
    api_key: Optional[str] = Field(default=None)
    api_base: Optional[str] = Field(default=None, description="Custom endpoint, e.g. for Ollama / vLLM")
    fallback_models: List[str] = Field(default_factory=lambda: ["ollama/deepseek-r1:7b", "openai/gpt-4o-mini"])

class UnifiedLLMClient:
    """Universal Multi-Provider LLM Client supporting Cloud and Local models."""

    def __init__(self, config: Optional[LLMConfig] = None):
        self.config = config or LLMConfig()

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        stream: bool = False
    ) -> Any:
        try:
            import litellm
            response = await litellm.acompletion(
                model=self.config.model_name,
                messages=messages,
                temperature=temperature or self.config.temperature,
                max_tokens=self.config.max_tokens,
                api_key=self.config.api_key,
                api_base=self.config.api_base,
                fallbacks=self.config.fallback_models,
                stream=stream
            )
            return response
        except Exception as e:
            # Fallback handling
            raise RuntimeError(f"LLM Generation failed for model {self.config.model_name}: {str(e)}")

    async def stream_response(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None
    ) -> AsyncGenerator[str, None]:
        response = await self.generate_response(messages, temperature=temperature, stream=True)
        async for chunk in response:
            content = chunk.choices[0].delta.content or ""
            if content:
                yield content
