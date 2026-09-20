import sys
from pathlib import Path

# Add all 16 sources directories to python path dynamically with root precedence
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
SOURCES_DIR = ROOT_DIR / "sources"

def inject_sources_to_syspath():
    """Dynamically registers all 16 open-source projects into Python sys.path while preserving root priority."""
    # Ensure ROOT_DIR is always at the top of sys.path
    root_str = str(ROOT_DIR)
    if root_str in sys.path:
        sys.path.remove(root_str)
    sys.path.insert(0, root_str)

    if SOURCES_DIR.exists():
        for item in SOURCES_DIR.iterdir():
            if item.is_dir():
                path_str = str(item)
                if path_str not in sys.path:
                    sys.path.append(path_str)
                # Specific nested python source roots
                nested_python = item / "python"
                if nested_python.exists() and str(nested_python) not in sys.path:
                    sys.path.append(str(nested_python))
                src_dir = item / "src"
                if src_dir.exists() and str(src_dir) not in sys.path:
                    sys.path.append(str(src_dir))
                # Nested libs (e.g. LangChain)
                libs_dir = item / "libs"
                if libs_dir.exists():
                    for lib in libs_dir.iterdir():
                        if lib.is_dir() and str(lib) not in sys.path:
                            sys.path.append(str(lib))

inject_sources_to_syspath()

from core.adapters.autogen_adapter import AutoGenAdapter
from core.adapters.browser_adapter import BrowserUseAdapter
from core.adapters.goose_ecc_adapter import GooseECCControlAdapter
from core.adapters.catalog_500_adapter import Catalog500AgentsAdapter
from core.adapters.adk_adapter import GoogleADKAdapter
from core.adapters.hermes_adapter import HermesAgentAdapter
from core.adapters.langchain_adapter import LangChainAdapter
from core.adapters.airi_adapter import AiriAvatarAdapter
from core.adapters.omnigent_adapter import OmnigentRouterAdapter

__all__ = [
    "inject_sources_to_syspath",
    "ROOT_DIR",
    "AutoGenAdapter",
    "BrowserUseAdapter",
    "GooseECCControlAdapter",
    "Catalog500AgentsAdapter",
    "GoogleADKAdapter",
    "HermesAgentAdapter",
    "LangChainAdapter",
    "AiriAvatarAdapter",
    "OmnigentRouterAdapter",
]
