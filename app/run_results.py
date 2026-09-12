import json
from pathlib import Path

from app.config import get_settings

MANIFEST_NAME = "run_status.json"


def read_run_metadata(directory: Path) -> dict:
    manifest = directory / MANIFEST_NAME
    if not manifest.exists():
        return {"outcome": "legacy"}
    try:
        data = json.loads(manifest.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {"outcome": "failed"}
    except (OSError, ValueError):
        return {"outcome": "failed"}


def write_run_metadata(run_id: str | None, metadata: dict) -> None:
    if not run_id:
        return
    root = get_settings().eval_dir.resolve()
    directory = (root / run_id).resolve()
    if directory.parent != root:
        raise ValueError("Invalid run directory")
    directory.mkdir(parents=True, exist_ok=True)
    temporary = directory / f"{MANIFEST_NAME}.tmp"
    temporary.write_text(json.dumps(metadata, ensure_ascii=False), encoding="utf-8")
    temporary.replace(directory / MANIFEST_NAME)
