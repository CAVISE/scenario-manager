import os
import signal
import subprocess
import sys
from pathlib import Path
from typing import Any


def launch_worker(
    input_path: Path,
    result_path: Path,
    progress_path: Path,
    *,
    base_dir: Path,
) -> subprocess.Popen[Any]:
    return subprocess.Popen(
        [
            sys.executable,
            "-m",
            "app.simulation_worker",
            str(input_path),
            str(result_path),
            str(progress_path),
        ],
        cwd=str(base_dir),
        start_new_session=True,
    )


def stop_worker(worker: subprocess.Popen[Any], grace_seconds: float) -> None:
    """Stop an isolated simulation process without blocking the API thread."""
    try:
        os.killpg(worker.pid, signal.SIGINT)
        worker.wait(timeout=grace_seconds)
        return
    except (ProcessLookupError, subprocess.TimeoutExpired):
        pass
    try:
        os.killpg(worker.pid, signal.SIGTERM)
        worker.wait(timeout=5)
        return
    except (ProcessLookupError, subprocess.TimeoutExpired):
        pass
    try:
        os.killpg(worker.pid, signal.SIGKILL)
    except ProcessLookupError:
        return
