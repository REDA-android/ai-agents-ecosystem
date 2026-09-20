from typing import Any, Dict, List, Set

class KnowledgeGraphStore:
    """Graph-based semantic memory connecting concepts, code symbols and agent findings (Graphify)."""

    def __init__(self):
        self.nodes: Dict[str, Dict[str, Any]] = {}
        self.edges: List[Dict[str, str]] = []

    def add_concept_node(self, node_id: str, label: str, metadata: Dict[str, Any] = None):
        self.nodes[node_id] = {
            "id": node_id,
            "label": label,
            "metadata": metadata or {}
        }

    def connect(self, source_id: str, target_id: str, relation: str):
        if source_id in self.nodes and target_id in self.nodes:
            self.edges.append({
                "source": source_id,
                "target": target_id,
                "relation": relation
            })

    def query_related(self, node_id: str) -> List[Dict[str, Any]]:
        related = []
        for edge in self.edges:
            if edge["source"] == node_id:
                related.append({"relation": edge["relation"], "node": self.nodes.get(edge["target"])})
            elif edge["target"] == node_id:
                related.append({"relation": f"reverse_{edge['relation']}", "node": self.nodes.get(edge["source"])})
        return related

    def export_graph(self) -> Dict[str, Any]:
        return {
            "nodes": list(self.nodes.values()),
            "edges": self.edges
        }

# Global graph store
knowledge_graph = KnowledgeGraphStore()
