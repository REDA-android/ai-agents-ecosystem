import sys
from pathlib import Path

# Add all 16 sources directories to python path dynamically
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
SOURCES_DIR = ROOT_DIR / "sources"

def inject_sources_to_syspath():
    """Dynamically registers all 16 open-source projects into Python sys.path."""
    if SOURCES_DIR.exists():
        for item in SOURCES_DIR.iterdir():
            if item.is_dir():
                path_str = str(item)
                if path_str not in sys.path:
                    sys.path.insert(0, path_str)
                # Specific nested python source roots
                nested_python = item / "python"
                if nested_python.exists():
                    sys.path.insert(0, str(nested_python))
                src_dir = item / "src"
                if src_dir.exists():
                    sys.path.insert(0, str(src_dir))

inject_sources_to_syspath()
