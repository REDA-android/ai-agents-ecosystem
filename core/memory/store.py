from typing import Any, Dict, List, Optional
import os

class VectorMemoryStore:
    """Long-term semantic memory and RAG storage for Agents."""

    def __init__(self, collection_name: str = "agent_knowledge"):
        self.collection_name = collection_name
        self._memory_cache: List[Dict[str, Any]] = []

    async def add_memory(self, content: str, metadata: Optional[Dict[str, Any]] = None):
        self._memory_cache.append({
            "content": content,
            "metadata": metadata or {}
        })

    async def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        # Simple match fallback if chromadb is not loaded
        results = [
            m for m in self._memory_cache 
            if any(word.lower() in m["content"].lower() for word in query.split())
        ]
        return results[:top_k]
