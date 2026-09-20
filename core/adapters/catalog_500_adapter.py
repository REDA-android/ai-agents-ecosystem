from pathlib import Path
from typing import Any, Dict, List
import json

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
PROJECTS_500_PATH = ROOT_DIR / "sources" / "500-AI-Agents-Projects" / "agents"

class Catalog500AgentsAdapter:
    """Provides direct functional access to all pre-built agents from 500-AI-Agents-Projects."""

    @staticmethod
    def list_available_blueprints() -> List[Dict[str, str]]:
        blueprints = []
        if PROJECTS_500_PATH.exists():
            for item in sorted(PROJECTS_500_PATH.iterdir()):
                if item.is_dir() and (item / "agent.py").exists():
                    blueprints.append({
                        "id": item.name,
                        "name": item.name.replace("-", " ").title(),
                        "path": str(item.relative_to(ROOT_DIR))
                    })
        return blueprints

    @staticmethod
    def load_blueprint_code(agent_id: str) -> Dict[str, Any]:
        target_dir = PROJECTS_500_PATH / agent_id
        if not target_dir.exists():
            return {"error": f"Agent blueprint {agent_id} not found."}
        
        agent_file = target_dir / "agent.py"
        readme_file = target_dir / "README.md"
        
        return {
            "id": agent_id,
            "code": agent_file.read_text(encoding="utf-8", errors="ignore") if agent_file.exists() else "",
            "readme": readme_file.read_text(encoding="utf-8", errors="ignore") if readme_file.exists() else ""
        }
