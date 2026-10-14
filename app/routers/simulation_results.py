"""HTTP routes for completed simulation artifacts.

Keeping these routes separate from the run-control router makes the result
storage boundary explicit and avoids coupling artifact access to scheduling.
"""

import shutil
from collections.abc import Callable
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse

from app.auth import require_roles
from app.log_config import get_logger
from app.rate_limit import limiter
from app.run_results import read_run_metadata
from app.schemas import ResultsResponse
from app.services.simulation.results import (
    COMPLETED_OUTCOMES,
    public_result_artifacts,
    read_chart_data,
)


def add_result_routes(
    router: APIRouter,
    *,
    result_directory: Callable[[str], Path],
    result_file_path: Callable[[str, str], Path],
    get_run: Callable[[str], Any | None],
    is_legacy_run_active: Callable[[str], bool],
) -> None:
    """Attach artifact routes using state access supplied by the run router."""
    log = get_logger(__name__)

    @router.get("/results/{run_id}", response_model=ResultsResponse)
    @limiter.limit("30/minute")
    async def list_results(request: Request, run_id: str):
        path = result_directory(run_id)
        if not path.exists() or not path.is_dir():
            raise HTTPException(status_code=404, detail="Results not found")
        record = get_run(run_id)
        if record is not None and record.status in {"running", "stopping"}:
            raise HTTPException(status_code=409, detail="Simulation is still running")
        if record is None and is_legacy_run_active(run_id):
            raise HTTPException(status_code=409, detail="Simulation is still running")
        if read_run_metadata(path).get("outcome") not in COMPLETED_OUTCOMES:
            raise HTTPException(
                status_code=404, detail="No completed results for this run"
            )

        files = public_result_artifacts(path, run_id)
        data, data_error = read_chart_data(
            path,
            run_id,
            on_error=lambda: log.warning(
                "Cannot read chart data for run_id=%s", run_id, exc_info=True
            ),
        )
        return ResultsResponse(
            files=files, run_id=run_id, data=data, data_error=data_error
        )

    @router.get("/results/{run_id}/files/{filename}")
    @limiter.limit("30/minute")
    async def get_result_file(request: Request, run_id: str, filename: str):
        """Serve one allowlisted artifact after the same access check as the API."""
        return FileResponse(result_file_path(run_id, filename))

    @router.delete(
        "/results/{run_id}",
        dependencies=[Depends(require_roles("admin", "operator"))],
    )
    @limiter.limit("10/minute")
    async def delete_results(request: Request, run_id: str):
        path = result_directory(run_id)
        record = get_run(run_id)
        if record is not None and record.status in {"running", "stopping"}:
            raise HTTPException(
                status_code=409,
                detail="Cannot delete results of a running simulation",
            )
        if record is not None and record.status == "queued":
            raise HTTPException(
                status_code=409,
                detail="Cannot delete results of a queued simulation",
            )
        if record is None and is_legacy_run_active(run_id):
            raise HTTPException(
                status_code=409,
                detail="Cannot delete results of a running simulation",
            )
        if not path.is_dir():
            raise HTTPException(status_code=404, detail="Results not found")
        shutil.rmtree(path)
        log.info("Deleted results for run_id=%s", run_id)
        return {"deleted": run_id}
