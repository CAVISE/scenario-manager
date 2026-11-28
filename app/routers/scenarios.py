import hashlib
import json
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Path, Query
from sqlalchemy import Text, cast, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_session
from app.auth import AuthenticatedUser, require_roles
from app.log_config import get_logger
from app.models import Scenario, ScenarioVersion
from app.scenario_validation import (
    extract_scenario_groups,
    normalize_optional_str,
    validate_scenario_jsonb,
)
from app.schemas import (
    ScenarioDetail,
    ScenarioMutationResponse,
    ScenarioPage,
    ScenarioSummary,
    ScenarioVersionDetail,
    ScenarioVersionMutationResponse,
    ScenarioVersionPage,
    ScenarioVersionSummary,
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
    try:
        validate_scenario_jsonb(scenario)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

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
    """Require explicit_clear for saved objects and unrecognized legacy content."""
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
    latest_preview = (
        select(ScenarioVersion.preview)
        .where(ScenarioVersion.scenario_id == Scenario.id)
        .order_by(ScenarioVersion.number.desc())
        .limit(1)
        .scalar_subquery()
    )
    rows = session.execute(
        select(
            Scenario.id,
            Scenario.scenario_id,
            Scenario.name_of_scenario,
            Scenario.annotation,
            latest_preview.label("preview"),
        )
        .where(Scenario.is_archived.is_(False))
        .order_by(Scenario.updated_at.desc(), Scenario.id.desc())
        .offset(offset)
        .limit(limit)
    ).all()
    total = (
        session.scalar(
            select(func.count())
            .select_from(Scenario)
            .where(Scenario.is_archived.is_(False))
        )
        or 0
    )
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


@router.get("/v1/scenarios/{scenario_id}/versions", response_model=ScenarioVersionPage)
def list_scenario_versions_v1(
    scenario_id: str,
    session: DatabaseSession,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
):
    scenario = session.execute(
        select(
            Scenario.id,
            func.count(ScenarioVersion.id).label("total"),
            func.max(ScenarioVersion.number).label("latest_revision"),
        )
        .outerjoin(ScenarioVersion, ScenarioVersion.scenario_id == Scenario.id)
        .where(
            Scenario.scenario_id == scenario_id,
            Scenario.is_archived.is_(False),
        )
        .group_by(Scenario.id)
    ).one_or_none()
    if scenario is None:
        raise HTTPException(status_code=404, detail="Scenario not found")

    rows = []
    if scenario.latest_revision is not None:
        rows = (
            session.execute(
                select(
                    ScenarioVersion.id,
                    ScenarioVersion.number,
                    ScenarioVersion.author_id,
                    ScenarioVersion.previous_version_id,
                    ScenarioVersion.created_at,
                    ScenarioVersion.map,
                )
                .where(
                    ScenarioVersion.scenario_id == scenario.id,
                    ScenarioVersion.number <= scenario.latest_revision,
                )
                .order_by(ScenarioVersion.number.desc())
                .offset(offset)
                .limit(limit)
            )
            .mappings()
            .all()
        )

    return ScenarioVersionPage(
        items=[ScenarioVersionSummary(**row) for row in rows],
        total=scenario.total,
        offset=offset,
        limit=limit,
        latest_revision=scenario.latest_revision,
    )


@router.get(
    "/v1/scenarios/{scenario_id}/versions/{number}",
    response_model=ScenarioVersionDetail,
)
def get_scenario_version_v1(
    scenario_id: str, number: Annotated[int, Path(ge=1)], session: DatabaseSession
):
    latest_revision = (
        select(func.max(ScenarioVersion.number))
        .where(ScenarioVersion.scenario_id == Scenario.id)
        .correlate(Scenario)
        .scalar_subquery()
    )
    row = (
        session.execute(
            select(
                ScenarioVersion.id,
                ScenarioVersion.number,
                ScenarioVersion.author_id,
                ScenarioVersion.previous_version_id,
                ScenarioVersion.created_at,
                ScenarioVersion.map,
                ScenarioVersion.content,
                ScenarioVersion.file_,
                ScenarioVersion.preview,
                latest_revision.label("latest_revision"),
            )
            .join(Scenario, Scenario.id == ScenarioVersion.scenario_id)
            .where(
                Scenario.scenario_id == scenario_id,
                Scenario.is_archived.is_(False),
                ScenarioVersion.number == number,
            )
        )
        .mappings()
        .one_or_none()
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Scenario version not found")

    return ScenarioVersionDetail(**row)


@router.post(
    "/v1/scenarios",
    response_model=ScenarioMutationResponse,
    status_code=201,
)
def create_scenario_v1(
    body: UploadScenarioRequest,
    session: DatabaseSession,
    user: Annotated[AuthenticatedUser, Depends(require_roles("admin", "operator"))],
):
    return _create_scenario(body, session, user_id=user.id)


@router.patch(
    "/v1/scenarios/{scenario_id}",
    response_model=ScenarioVersionMutationResponse,
)
def update_scenario_v1(
    scenario_id: str,
    body: UpdateScenarioRequest,
    session: DatabaseSession,
    user: Annotated[AuthenticatedUser, Depends(require_roles("admin", "operator"))],
    idempotency_key: Annotated[
        uuid.UUID | None,
        Header(description="Reuse the UUID when retrying the same save."),
    ] = None,
):
    if scenario_id != body.scenario_id:
        raise HTTPException(status_code=400, detail="scenario_id does not match URL")
    version_id, number = _update_scenario(
        body, session, user_id=user.id, idempotency_key=idempotency_key
    )
    return ScenarioVersionMutationResponse(
        status="success",
        message="Scenario updated",
        scenario_id=scenario_id,
        revision=number,
        version_id=version_id,
    )


@router.delete(
    "/v1/scenarios/{scenario_id}",
    response_model=ScenarioMutationResponse,
    dependencies=[Depends(require_roles("admin", "operator"))],
)
def delete_scenario_v1(scenario_id: str, session: DatabaseSession):
    return _delete_scenario(scenario_id, session)


def _get_scenario_detail(scenario_id: str, session: DatabaseSession) -> ScenarioDetail:
    log.info("action=get_scenario scenario_id=%s", scenario_id)
    row = session.execute(
        select(
            Scenario.id,
            Scenario.scenario_id,
            Scenario.name_of_scenario,
            Scenario.annotation,
            ScenarioVersion.number.label("revision"),
            ScenarioVersion.content.label("scenario_text"),
            ScenarioVersion.preview,
            ScenarioVersion.file_,
            ScenarioVersion.map,
        )
        .join(ScenarioVersion, ScenarioVersion.scenario_id == Scenario.id)
        .where(
            Scenario.scenario_id == scenario_id,
            Scenario.is_archived.is_(False),
        )
        .order_by(ScenarioVersion.number.desc())
        .limit(1)
    ).one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Scenario not found")

    return ScenarioDetail(
        id=row.id,
        revision=row.revision,
        scenario_id=str(row.scenario_id),
        name_of_scenario=row.name_of_scenario,
        scenario_text=row.scenario_text,
        preview=row.preview,
        annotation=row.annotation,
        file_=row.file_,
        map=row.map,
    )


def _create_scenario(
    body: UploadScenarioRequest, session: DatabaseSession, *, user_id: int | None
) -> ScenarioMutationResponse:
    log.info("action=create_scenario name=%s", body.name_of_scenario)

    scenario_id = body.scenario_id or uuid.uuid4().hex
    find_existing = select(Scenario.id).where(Scenario.scenario_id == scenario_id)
    if body.scenario_id and session.scalar(find_existing) is not None:
        raise HTTPException(
            status_code=409,
            detail="Scenario with this ID already exists",
        )

    content = _normalize_scenario_blob(body.scenario)
    row = Scenario(
        scenario_id=scenario_id,
        name_of_scenario=body.name_of_scenario,
        owner_id=user_id,
        annotation=body.description,
    )
    session.add(row)
    try:
        session.flush()
    except IntegrityError as exc:
        session.rollback()
        if session.scalar(find_existing) is None:
            raise
        raise HTTPException(
            status_code=409,
            detail="Scenario with this ID already exists",
        ) from exc

    session.add(
        ScenarioVersion(
            scenario_id=row.id,
            number=1,
            content=content,
            author_id=user_id,
            map=body.map,
            file_=body.file_,
            preview=body.preview,
        )
    )
    session.commit()

    return ScenarioMutationResponse(
        status="success",
        message="Scenario created",
        scenario_id=scenario_id,
        revision=1,
    )


def _update_scenario(
    body: UpdateScenarioRequest,
    session: DatabaseSession,
    *,
    user_id: int | None,
    idempotency_key: uuid.UUID | None,
) -> tuple[int, int]:
    log.info("action=update_scenario scenario_id=%s", body.scenario_id)
    request_hash = None
    if idempotency_key is not None:
        payload = json.dumps(
            body.model_dump(exclude_unset=True), sort_keys=True, separators=(",", ":")
        )
        request_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()

    row = session.scalar(
        select(Scenario)
        .where(
            Scenario.scenario_id == body.scenario_id,
            Scenario.is_archived.is_(False),
        )
        .with_for_update()
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Scenario not found")

    if idempotency_key is not None:
        existing = session.execute(
            select(
                ScenarioVersion.id,
                ScenarioVersion.number,
                ScenarioVersion.author_id,
                ScenarioVersion.request_hash,
            ).where(
                ScenarioVersion.scenario_id == row.id,
                ScenarioVersion.idempotency_key == idempotency_key,
            )
        ).one_or_none()
        if existing is not None:
            if existing.author_id != user_id or existing.request_hash != request_hash:
                raise HTTPException(
                    status_code=409, detail="Idempotency-Key was used for another save"
                )
            return existing.id, existing.number

    versions = select(
        ScenarioVersion.id,
        ScenarioVersion.number,
        ScenarioVersion.map,
        ScenarioVersion.file_,
        ScenarioVersion.preview,
    ).where(ScenarioVersion.scenario_id == row.id)
    previous = session.execute(
        versions.order_by(ScenarioVersion.number.desc()).limit(1)
    ).one_or_none()
    if previous is None:
        raise HTTPException(
            status_code=500, detail="Scenario version history is missing"
        )
    if body.expected_revision is not None and body.expected_revision != previous.number:
        raise HTTPException(
            status_code=409,
            detail="Scenario was changed in another session; reload before saving",
        )

    source = previous
    if (
        body.source_version_number is not None
        and body.source_version_number != previous.number
    ):
        source = session.execute(
            versions.where(ScenarioVersion.number == body.source_version_number)
        ).one_or_none()
        if source is None:
            raise HTTPException(status_code=404, detail="Scenario version not found")

    saved_content = (
        select(ScenarioVersion.content)
        .where(ScenarioVersion.id == source.id)
        .scalar_subquery()
    )
    incoming_groups = extract_scenario_groups(body.scenario)
    incoming_is_empty = not incoming_groups or all(
        not g.get("path") for g in incoming_groups
    )
    had_existing_content = body.scenario is not None and _scenario_text_has_content(
        session.scalar(select(cast(saved_content, Text)))
    )
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
    stored_map = normalize_optional_str(source.map)
    map_changed = incoming_map is not None and incoming_map != stored_map
    can_explicitly_clear_for_map_change = body.explicit_clear and incoming_is_empty
    if (
        body.scenario is not None
        and map_changed
        and had_existing_content
        and not can_explicitly_clear_for_map_change
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "A saved scenario with placed objects cannot change maps. "
                "Choose the new map in the editor to create a new draft."
            ),
        )

    # Copy unchanged JSON in the database to preserve numeric precision.
    content = (
        _normalize_scenario_blob(body.scenario)
        if body.scenario is not None
        else saved_content
    )

    if body.scenario_name is not None:
        row.name_of_scenario = body.scenario_name
    if body.annotation is not None:
        row.annotation = body.annotation

    number = previous.number + 1
    row.updated_at = func.now()
    version = ScenarioVersion(
        scenario_id=row.id,
        number=number,
        previous_version_id=previous.id,
        author_id=user_id,
        content=content,
        map=body.map if body.map is not None else source.map,
        file_=body.file_ if body.file_ is not None else source.file_,
        preview=body.preview if "preview" in body.model_fields_set else source.preview,
        idempotency_key=idempotency_key,
        request_hash=request_hash,
    )
    session.add(version)
    session.commit()
    return version.id, number


def _delete_scenario(
    scenario_id: str, session: DatabaseSession
) -> ScenarioMutationResponse:
    log.info("action=delete_scenario scenario_id=%s", scenario_id)
    row = session.scalar(
        select(Scenario).where(
            Scenario.scenario_id == scenario_id,
            Scenario.is_archived.is_(False),
        )
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Scenario not found")

    row.is_archived = True
    session.commit()
    return ScenarioMutationResponse(
        status="success",
        message="Scenario deleted",
        scenario_id=scenario_id,
    )
