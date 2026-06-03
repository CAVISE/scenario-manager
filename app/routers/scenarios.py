import json

from fastapi import APIRouter, HTTPException

from app.database import get_conn
from app.log_config import get_logger
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
async def load_all_scenarios():
    log.info("action=load_all_scenarios")
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, scenario_id, name_of_scenario, preview, annotation FROM scenarios"
            )
            rows = cur.fetchall()

    scenarios = [
        ScenarioSummary(
            id=row[0],
            scenario_id=str(row[1]),
            name=row[2],
            preview=row[3],
            annotation=row[4],
        )
        for row in rows
    ]
    return LoadAllScenariosResponse(
        status="success", count=len(scenarios), scenarios=scenarios
    )


@router.get("/load_scenario/{scenario_id}", response_model=LoadScenarioResponse)
async def load_scenario(scenario_id: str):
    log.info("action=load_scenario scenario_id=%s", scenario_id)
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, scenario_id, name_of_scenario, scenario_text,
                       preview, annotation, file_
                FROM scenarios WHERE scenario_id = %s
                """,
                (scenario_id,),
            )
            row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Scenario not found")

    scenario_text = row[3]
    if scenario_text:
        try:
            scenario_text = json.loads(scenario_text)
        except json.JSONDecodeError:
            pass

    return LoadScenarioResponse(
        status="success",
        scenario=ScenarioDetail(
            id=row[0],
            scenario_id=str(row[1]),
            name_of_scenario=row[2],
            scenario_text=scenario_text,
            preview=row[4],
            annotation=row[5],
            file_=row[6],
        ),
    )


@router.post("/upload_scenario", response_model=ScenarioMutationResponse)
async def upload_scenario(body: UploadScenarioRequest):
    log.info("action=upload_scenario name=%s", body.name_of_scenario)
    scenario_text = json.dumps(_normalize_scenario_blob(body.scenario))

    with get_conn() as conn:
        with conn.cursor() as cur:
            if body.scenario_id:
                cur.execute(
                    "SELECT 1 FROM scenarios WHERE scenario_id = %s",
                    (body.scenario_id,),
                )
                if cur.fetchone():
                    raise HTTPException(
                        status_code=409,
                        detail="Scenario with this ID already exists",
                    )

            cur.execute(
                """
                INSERT INTO scenarios
                    (scenario_id, name_of_scenario, scenario_text, preview, annotation, file_)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    body.scenario_id,
                    body.name_of_scenario,
                    scenario_text,
                    body.preview,
                    body.description,
                    body.file_,
                ),
            )
            conn.commit()

    return ScenarioMutationResponse(status="success", message="Scenario created")


@router.post("/update_scenario", response_model=ScenarioMutationResponse)
async def update_scenario(body: UpdateScenarioRequest):
    log.info("action=update_scenario scenario_id=%s", body.scenario_id)
    # Only serialize when explicitly provided to avoid overwriting with empty object
    scenario_text = (
        json.dumps(_normalize_scenario_blob(body.scenario))
        if body.scenario is not None
        else None
    )

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT scenario_id FROM scenarios WHERE scenario_id = %s",
                (body.scenario_id,),
            )
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Scenario not found")

            cur.execute(
                """
                UPDATE scenarios
                SET name_of_scenario = COALESCE(%s, name_of_scenario),
                    scenario_text     = COALESCE(%s, scenario_text),
                    preview           = COALESCE(%s, preview),
                    annotation        = COALESCE(%s, annotation)
                WHERE scenario_id = %s
                """,
                (
                    body.scenario_name,
                    scenario_text,
                    body.preview,
                    body.annotation,
                    body.scenario_id,
                ),
            )
            conn.commit()

    return ScenarioMutationResponse(
        status="success",
        message="Scenario updated",
        scenario_id=body.scenario_id,
    )


@router.post("/delete_scenario", response_model=ScenarioMutationResponse)
async def delete_scenario(body: DeleteScenarioRequest):
    log.info("action=delete_scenario scenario_id=%s", body.scenario_id)

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM scenarios WHERE scenario_id = %s",
                (body.scenario_id,),
            )
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Scenario not found")
            conn.commit()

    return ScenarioMutationResponse(
        status="success",
        message="Scenario deleted",
        scenario_id=body.scenario_id,
    )