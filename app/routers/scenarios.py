import json
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_session
from app.log_config import get_logger
from app.models import Scenario
from app.schemas import (
    DeleteScenarioRequest,
    LoadAllScenariosResponse,
    LoadScenarioResponse,
    ScenarioDetail,
    ScenarioMutationResponse,
    ScenarioSummary,
    UpdateScenarioRequest,
    UploadScenarioRequest,
)

router = APIRouter(tags=["scenarios"])
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


@router.get("/load_all_scenarios", response_model=LoadAllScenariosResponse)
def load_all_scenarios(session: DatabaseSession):
    log.info("action=load_all_scenarios")
    rows = session.scalars(select(Scenario)).all()
    scenarios = [
        ScenarioSummary(
            id=row.id,
            scenario_id=str(row.scenario_id),
            name=row.name_of_scenario,
            preview=row.preview,
            annotation=row.annotation,
        )
        for row in rows
    ]
    return LoadAllScenariosResponse(
        status="success", count=len(scenarios), scenarios=scenarios
    )


@router.get("/load_scenario/{scenario_id}", response_model=LoadScenarioResponse)
def load_scenario(scenario_id: str, session: DatabaseSession):
    log.info("action=load_scenario scenario_id=%s", scenario_id)
    row = session.scalar(select(Scenario).where(Scenario.scenario_id == scenario_id))
    if row is None:
        raise HTTPException(status_code=404, detail="Scenario not found")

    scenario_text = row.scenario_text
    if scenario_text:
        try:
            scenario_text = json.loads(scenario_text)
        except json.JSONDecodeError:
            pass

    return LoadScenarioResponse(
        status="success",
        scenario=ScenarioDetail(
            id=row.id,
            scenario_id=str(row.scenario_id),
            name_of_scenario=row.name_of_scenario,
            scenario_text=scenario_text,
            preview=row.preview,
            annotation=row.annotation,
            file_=row.file_,
        ),
    )


@router.post("/upload_scenario", response_model=ScenarioMutationResponse)
def upload_scenario(body: UploadScenarioRequest, session: DatabaseSession):
    log.info("action=upload_scenario name=%s", body.name_of_scenario)
    if body.scenario_id:
        existing_id = session.scalar(
            select(Scenario.id).where(Scenario.scenario_id == body.scenario_id)
        )
        if existing_id is not None:
            raise HTTPException(
                status_code=409,
                detail="Scenario with this ID already exists",
            )

    session.add(
        Scenario(
            scenario_id=body.scenario_id,
            name_of_scenario=body.name_of_scenario,
            scenario_text=json.dumps(_normalize_scenario_blob(body.scenario)),
            preview=body.preview,
            annotation=body.description,
            file_=body.file_,
        )
    )
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(
            status_code=409,
            detail="Scenario with this ID already exists",
        ) from exc

    return ScenarioMutationResponse(status="success", message="Scenario created")


@router.post("/update_scenario", response_model=ScenarioMutationResponse)
def update_scenario(body: UpdateScenarioRequest, session: DatabaseSession):
    log.info("action=update_scenario scenario_id=%s", body.scenario_id)
    row = session.scalar(
        select(Scenario).where(Scenario.scenario_id == body.scenario_id)
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Scenario not found")

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
    session.commit()

    return ScenarioMutationResponse(
        status="success",
        message="Scenario updated",
        scenario_id=body.scenario_id,
    )


@router.post("/delete_scenario", response_model=ScenarioMutationResponse)
def delete_scenario(body: DeleteScenarioRequest, session: DatabaseSession):
    log.info("action=delete_scenario scenario_id=%s", body.scenario_id)
    row = session.scalar(
        select(Scenario).where(Scenario.scenario_id == body.scenario_id)
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Scenario not found")

    session.delete(row)
    session.commit()
    return ScenarioMutationResponse(
        status="success",
        message="Scenario deleted",
        scenario_id=body.scenario_id,
    )
