"""Isolated CARLA process used by the API worker."""

from __future__ import annotations

import json
import sys
import traceback
from pathlib import Path

from app import runner


def _write_json(path: Path, payload: dict) -> None:
    temporary = path.with_suffix(f"{path.suffix}.tmp")
    temporary.write_text(json.dumps(payload), encoding="utf-8")
    temporary.replace(path)


def main(input_path: str, result_path: str, progress_path: str) -> int:
    payload = json.loads(Path(input_path).read_text(encoding="utf-8"))

    def report(tick: int, maximum: int) -> None:
        _write_json(Path(progress_path), {"tick": tick, "max_ticks": maximum})

    try:
        result = runner.run_scenario(
            payload["scenario_raw"], {**payload["params"], "on_progress": report}
        )
        _write_json(Path(result_path), {"result": result})
        return 0
    except BaseException as error:
        _write_json(
            Path(result_path),
            {"error": str(error), "traceback": traceback.format_exc()},
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main(*sys.argv[1:]))
