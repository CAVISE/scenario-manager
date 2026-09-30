from collections.abc import Callable
from pathlib import Path
from urllib.parse import quote

from pydantic import ValidationError

from app.chart_schema import CHARTS_NAME, ChartDocument
from app.run_results import MANIFEST_NAME, read_run_metadata
from app.schemas import ResultRun

INTERNAL_RUN_FILES = frozenset(
    {"worker_input.json", "worker_result.json", "worker_progress.json"}
)
AVAILABLE_RESULT_SUFFIXES = frozenset({".png", ".txt", ".log", ".yaml", ".json"})
COMPLETED_OUTCOMES = frozenset({"complete", "partial", "legacy"})


class ResultAccessError(Exception):
    """A result artifact cannot be accessed through the public API."""

    def __init__(self, status_code: int, detail: str) -> None:
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


def result_directory(eval_dir: Path, run_id: str) -> Path:
    root = eval_dir.resolve()
    path = root / run_id
    if (
        not run_id
        or ".." in run_id
        or any(char in run_id for char in "/\\:")
        or path.is_symlink()
        or path.resolve().parent != root
    ):
        raise ResultAccessError(400, "Invalid run_id")
    return path


def result_file_path(eval_dir: Path, run_id: str, filename: str) -> Path:
    if (
        not filename
        or filename in INTERNAL_RUN_FILES
        or Path(filename).name != filename
    ):
        raise ResultAccessError(400, "Invalid result filename")
    path = result_directory(eval_dir, run_id) / filename
    if not path.is_file() or path.is_symlink():
        raise ResultAccessError(404, "Result file not found")
    if path.suffix.lower() not in AVAILABLE_RESULT_SUFFIXES:
        raise ResultAccessError(404, "Result file is not available")
    return path


def result_file_url(run_id: str, filename: str) -> str:
    return f"/api/results/{quote(run_id, safe='')}/files/{quote(filename, safe='')}"


def public_result_files(directory: Path) -> list[str]:
    return sorted(
        item.name
        for item in directory.iterdir()
        if item.is_file()
        and not item.is_symlink()
        and item.name != MANIFEST_NAME
        and item.name not in INTERNAL_RUN_FILES
        and item.suffix.lower() in AVAILABLE_RESULT_SUFFIXES
    )


def list_completed_runs(
    eval_dir: Path, *, active_run_id: str | None = None
) -> list[ResultRun]:
    if not eval_dir.exists():
        return []

    runs: list[ResultRun] = []
    for entry in eval_dir.iterdir():
        if (
            not entry.is_dir()
            or entry.is_symlink()
            or ".." in entry.name
            or any(char in entry.name for char in "/\\:")
        ):
            continue
        metadata = read_run_metadata(entry)
        if metadata.get("outcome") not in COMPLETED_OUTCOMES:
            continue
        if entry.name == active_run_id:
            continue
        runs.append(
            ResultRun(
                run_id=entry.name,
                files_count=len(public_result_files(entry)),
                modified_at=entry.stat().st_mtime,
                outcome=metadata.get("outcome", "legacy"),
                is_demo=metadata.get("is_demo") is True,
                tick=metadata.get("tick"),
                max_ticks=metadata.get("max_ticks"),
                scenario_name=metadata.get("scenario_name"),
                scenario_id=metadata.get("scenario_id"),
            )
        )
    return sorted(runs, key=lambda run: run.modified_at, reverse=True)


def read_chart_data(
    directory: Path, run_id: str, *, on_error: Callable[[], None] | None = None
) -> tuple[ChartDocument | None, str | None]:
    chart_path = directory / CHARTS_NAME
    if chart_path.is_symlink():
        return (
            None,
            "Chart data is unavailable. Other result files can still be downloaded.",
        )
    if not chart_path.exists():
        return None, None
    try:
        data = ChartDocument.model_validate_json(chart_path.read_text(encoding="utf-8"))
        if data.run_id != run_id:
            raise ValueError("Chart run_id does not match its directory")
        return data, None
    except (OSError, ValueError, ValidationError):
        if on_error is not None:
            on_error()
        return (
            None,
            "Chart data could not be read. Other result files can still be downloaded.",
        )
