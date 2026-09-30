import json
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_session
from app.auth import require_roles
from app.log_config import get_logger
from app.models import Scenario
from app.scenario_validation import extract_scenario_groups, normalize_optional_str
from app.schemas import (
    ScenarioDetail,
    ScenarioMutationResponse,
    ScenarioPage,
    ScenarioSummary,
    UpdateScenarioRequest,
    UploadScenarioRequest,
)

router = APIRouter(
    tags=["scenarios"],
    dependencies=[Depends(require_roles("admin", "operator", "viewer"))],
)
log = get_logger(__name__)
DatabaseSession = Annotated[Session, Depends(get_session)]


def _normalize_scenario_blob(scenario) -> dict:
    if scenario is None:
        return {}
    if isinstance(scenario, list):
        return {"scenario_text": scenario}
    if isinstance(scenario, dict):
        if "scenario_text" in scenario:
            return scenario
        return {"scenario_text": [scenario]}
    return {}


def _scenario_text_has_content(scenario_text: str | None) -> bool:
    """Whether a stored Scenario.scenario_text represents a scene with
    actual cars/RSUs/pedestrians placed, for update_scenario's
    accidental-wipe guard.

    Deliberately conservative: anything that can't be positively shown
    to be empty is treated as having content, so the guard fails closed
    (blocks and asks for explicit_clear) rather than failing open and
    letting real data through undetected. This covers stored rows with
    malformed/legacy JSON the same way load_scenario already tolerates
    them (see test_load_scenario_handles_invalid_json_text) -- unparsable
    text is not proof of emptiness, so it counts as content here.
    """
    if not scenario_text or scenario_text in ("{}", "null", "[]"):
        return False
    try:
        parsed = json.loads(scenario_text)
    except (TypeError, ValueError):
        return True
    try:
        groups = extract_scenario_groups(parsed)
    except ValueError:
        return True
    return any(g.get("path") for g in groups)


@router.get("/v1/scenarios", response_model=ScenarioPage)
def list_scenarios_v1(
    session: DatabaseSession,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
):
    rows = session.scalars(
        select(Scenario)
        .order_by(Scenario.updated_at.desc(), Scenario.id.desc())
        .offset(offset)
        .limit(limit)
    ).all()
    total = session.scalar(select(func.count()).select_from(Scenario)) or 0
    return ScenarioPage(
        items=[
            ScenarioSummary(
                id=row.id,
                scenario_id=str(row.scenario_id),
                name=row.name_of_scenario,
                preview=row.preview,
                annotation=row.annotation,
            )
            for row in rows
        ],
        total=total,
        offset=offset,
        limit=limit,
    )


@router.get("/v1/scenarios/{scenario_id}", response_model=ScenarioDetail)
def get_scenario_v1(scenario_id: str, session: DatabaseSession):
    return _get_scenario_detail(scenario_id, session)


@router.post(
    "/v1/scenarios",
    response_model=ScenarioMutationResponse,
    status_code=201,
    dependencies=[Depends(require_roles("admin", "operator"))],
)
def create_scenario_v1(body: UploadScenarioRequest, session: DatabaseSession):
    return _create_scenario(body, session)


@router.patch(
    "/v1/scenarios/{scenario_id}",
    response_model=ScenarioMutationResponse,
    dependencies=[Depends(require_roles("admin", "operator"))],
)
def update_scenario_v1(
    scenario_id: str, body: UpdateScenarioRequest, session: DatabaseSession
):
    if scenario_id != body.scenario_id:
        raise HTTPException(status_code=400, detail="scenario_id does not match URL")
    return _update_scenario(body, session)


@router.delete(
    "/v1/scenarios/{scenario_id}",
    response_model=ScenarioMutationResponse,
    dependencies=[Depends(require_roles("admin", "operator"))],
)
def delete_scenario_v1(scenario_id: str, session: DatabaseSession):
    return _delete_scenario(scenario_id, session)


def _get_scenario_detail(scenario_id: str, session: DatabaseSession) -> ScenarioDetail:
    log.info("action=get_scenario scenario_id=%s", scenario_id)
    row = session.scalar(select(Scenario).where(Scenario.scenario_id == scenario_id))
    if row is None:
        raise HTTPException(status_code=404, detail="Scenario not found")

    scenario_text = row.scenario_text
    if scenario_text:
        try:
            scenario_text = json.loads(scenario_text)
        except json.JSONDecodeError:
            pass

    return ScenarioDetail(
        id=row.id,
        revision=row.revision,
        scenario_id=str(row.scenario_id),
        name_of_scenario=row.name_of_scenario,
        scenario_text=scenario_text,
        preview=row.preview,
        annotation=row.annotation,
        file_=row.file_,
        map=row.map,
    )


def _create_scenario(
    body: UploadScenarioRequest, session: DatabaseSession
) -> ScenarioMutationResponse:
    log.info("action=create_scenario name=%s", body.name_of_scenario)

    scenario_id = body.scenario_id or uuid.uuid4().hex
    if body.scenario_id:
        existing_id = session.scalar(
            select(Scenario.id).where(Scenario.scenario_id == scenario_id)
        )
        if existing_id is not None:
            raise HTTPException(
                status_code=409,
                detail="Scenario with this ID already exists",
            )

    row = Scenario(
        scenario_id=scenario_id,
        name_of_scenario=body.name_of_scenario,
        scenario_text=json.dumps(_normalize_scenario_blob(body.scenario)),
        preview=body.preview,
        annotation=body.description,
        file_=body.file_,
        map=body.map,
    )
    session.add(row)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(
            status_code=409,
            detail="Scenario with this ID already exists",
        ) from exc

    return ScenarioMutationResponse(
        status="success",
        message="Scenario created",
        scenario_id=scenario_id,
        revision=row.revision,
    )


def _update_scenario(
    body: UpdateScenarioRequest, session: DatabaseSession
) -> ScenarioMutationResponse:
    log.info("action=update_scenario scenario_id=%s", body.scenario_id)
    row = session.scalar(
        select(Scenario).where(Scenario.scenario_id == body.scenario_id)
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Scenario not found")
    if body.expected_revision is not None and row.revision != body.expected_revision:
        raise HTTPException(
            status_code=409,
            detail="Scenario was changed in another session; reload before saving",
        )

    incoming_groups = extract_scenario_groups(body.scenario)
    incoming_is_empty = not incoming_groups or all(
        not g.get("path") for g in incoming_groups
    )
    had_existing_content = _scenario_text_has_content(row.scenario_text)
    if (
        body.scenario is not None
        and incoming_is_empty
        and had_existing_content
        and not body.explicit_clear
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                f"Scenario '{body.scenario_id}' already has cars/RSUs/"
                f"pedestrians placed, and this save would replace them "
                f"with an empty scene. If that's intentional, resend "
                f"with explicit_clear=true. Otherwise, this save was "
                f"about to silently erase existing content."
            ),
        )

    incoming_map = normalize_optional_str(body.map)
    stored_map = normalize_optional_str(row.map)
    map_changed = incoming_map is not None and incoming_map != stored_map
    map_change_warning = None
    if map_changed and not incoming_is_empty:
        map_change_warning = (
            f"Map changed from '{stored_map or '(unset)'}' to "
            f"'{incoming_map}' while cars/RSUs/pedestrians are still "
            f"present. Their positions were likely placed against the "
            f"previous map and may not land on valid roads here -- "
            f"double-check them in the editor."
        )

    if body.scenario_name is not None:
        row.name_of_scenario = body.scenario_name
    if body.scenario is not None:
        row.scenario_text = json.dumps(_normalize_scenario_blob(body.scenario))
    if body.preview is not None:
        row.preview = body.preview
    if body.annotation is not None:
        row.annotation = body.annotation
    if body.file_ is not None:
        row.file_ = body.file_
    if body.map is not None:
        row.map = body.map
    row.revision += 1
    session.commit()

    return ScenarioMutationResponse(
        status="success",
        message="Scenario updated",
        scenario_id=body.scenario_id,
        revision=row.revision,
        warning=map_change_warning,
    )


def _delete_scenario(
    scenario_id: str, session: DatabaseSession
) -> ScenarioMutationResponse:
    log.info("action=delete_scenario scenario_id=%s", scenario_id)
    row = session.scalar(select(Scenario).where(Scenario.scenario_id == scenario_id))
    if row is None:
        raise HTTPException(status_code=404, detail="Scenario not found")

    session.delete(row)
    session.commit()
    return ScenarioMutationResponse(
        status="success",
        message="Scenario deleted",
        scenario_id=scenario_id,
    )
