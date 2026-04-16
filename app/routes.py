import json
import logging

from fastapi.routing import APIRouter
from fastapi import BackgroundTasks, HTTPException
from omegaconf import OmegaConf
import psycopg2
from opencda.scenario_testing.utils.yaml_utils import add_current_time
from app import runner, utils
from dotenv import load_dotenv
import os

load_dotenv(".env.local")

DB_CONFIG = {
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": os.getenv("DB_PORT"),
    "client_encoding": os.getenv("DB_ENCODING"),
}
router = APIRouter()
CFG_DIR = "assets/opencda"

logger = logging.getLogger(__name__)

simulation_state = {
    "running": False,
    "status": "idle", 
    "error": None,
    "map": None,
}


@router.post("/start_opencda")
async def start_opencda(scenario_raw: dict, background_tasks: BackgroundTasks):
    if simulation_state["running"]:
        raise HTTPException(status_code=409, detail="Simulation already running")

    base_yaml = f"{CFG_DIR}/base.yaml"
    scenario = utils.json_to_single_cav_list(scenario_raw)
    base_dict = OmegaConf.load(base_yaml)
    scenario_dict = OmegaConf.create(scenario)
    scene_dict = OmegaConf.merge(base_dict, scenario_dict)
    scene_dict = add_current_time(scene_dict)

    map_name = scenario_raw.get("map", "town10")

    params = {
        "apply_ml": False,
        "record": False,
        "map_name": map_name,
    }

    def run_with_state(scene_dict, params):
        simulation_state["running"] = True
        simulation_state["status"] = "running"
        simulation_state["error"] = None
        simulation_state["map"] = params["map_name"]
        try:
            runner.run_scenario(scene_dict, params)
            simulation_state["status"] = "finished"
        except Exception as e:
            simulation_state["status"] = "error"
            simulation_state["error"] = str(e)
        finally:
            simulation_state["running"] = False

    background_tasks.add_task(run_with_state, scene_dict, params)
    return {"status": "started", "map": map_name}


@router.get("/status")
async def get_status():
    return simulation_state


@router.post("/stop")
async def stop_simulation():
    if not simulation_state["running"]:
        raise HTTPException(status_code=400, detail="No simulation running")

    try:
        import carla
        client = carla.Client("localhost", 2000)
        client.set_timeout(5.0)
        world = client.get_world()
        actors = world.get_actors()
        for actor in actors:
            if "vehicle" in str(actor.type_id) or "sensor" in str(actor.type_id):
                actor.destroy()
        simulation_state["running"] = False
        simulation_state["status"] = "idle"
        return {"status": "stopped"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    



def get_db_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection error: {str(e)}")


def log_action(task_name: str, scenario_id: int = None):
    logger.info("action=%s scenario_id=%s", task_name, scenario_id)

@router.get('/load_all_scenarios')
async def load_all_scenarios(background_tasks: BackgroundTasks):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
            SELECT id, scenario_id, name_of_scenario, preview, annotation
            FROM scenarios
        """
        cursor.execute(query)
        rows = cursor.fetchall()

        scenarios = []
        for row in rows:
            scenarios.append({
                "id": row[0],
                "scenario_id": str(row[1]),
                "name": row[2],
                "preview": row[3],
                "annotation": row[4]
            })

        background_tasks.add_task(log_action, "load_all_scenarios")
        return {"status": "success", "count": len(scenarios), "scenarios": scenarios}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor: cursor.close()
        if conn: conn.close()
@router.get('/load_scenario/{scenario_id}')
async def load_scenario(scenario_id: str, background_tasks: BackgroundTasks = None):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
            SELECT id, scenario_id, name_of_scenario, scenario_text, preview, annotation
            FROM scenarios
            WHERE scenario_id = %s
        """
        cursor.execute(query, (scenario_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Scenario not found")
        scenario_text = row[3]
        if scenario_text:
            try:
                scenario_text = json.loads(scenario_text)
            except json.JSONDecodeError:
                pass

        result = {
            "id": row[0],
            "scenario_id": str(row[1]),
            "name_of_scenario": row[2],
            "scenario_text": scenario_text,
            "preview": row[4],
            "annotation": row[5]
        }

        if background_tasks:
            background_tasks.add_task(log_action, "load_scenario", str())

        return {"status": "success", "scenario": result}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor: cursor.close()
        if conn: conn.close()
@router.post('/upload_scenario')
async def upload_scenario(scenario_raw: dict, background_tasks: BackgroundTasks):
    conn = None
    cursor = None
    try:
        if 'name_of_scenario' not in scenario_raw:
            raise HTTPException(status_code=400, detail="Field 'name_of_scenario' is required")

        conn = get_db_connection()
        cursor = conn.cursor()

        name = scenario_raw['name_of_scenario']
        scenario_text = json.dumps(scenario_raw.get('scenario', {}))
        preview = scenario_raw.get('preview')     
        annotation = scenario_raw.get('description')
        scenario_id = scenario_raw.get('scenario_id')

        query = """
            INSERT INTO scenarios (scenario_id, name_of_scenario, scenario_text, preview, annotation)
            VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(query, (scenario_id, name, scenario_text, preview, annotation))
        conn.commit()

        background_tasks.add_task(log_action, "upload_scenario")

        return {"status": "success", "message": "Scenario created"}

    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor: cursor.close()
        if conn: conn.close()
@router.post('/update_scenario')
async def update_scenario(scenario_raw: dict, background_tasks: BackgroundTasks):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        scenario_id = scenario_raw['scenario_id']
        cursor.execute("SELECT scenario_id FROM scenarios WHERE scenario_id = %s", (scenario_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Scenario to update not found")

        name = scenario_raw.get('scenario_name')
        scenario_text = json.dumps(scenario_raw.get('scenario', {}))
        preview = scenario_raw.get('preview')
        annotation = scenario_raw.get('annotation')

        query = """
            UPDATE scenarios
            SET name_of_scenario = %s, scenario_text = %s, preview = %s, annotation = %s
            WHERE scenario_id = %s
        """
        cursor.execute(query, (name, scenario_text, preview, annotation, scenario_id))
        conn.commit()

        background_tasks.add_task(log_action, "update_scenario", str())

        return {"status": "success", "message": "Scenario updated", "scenario_id": scenario_id}

    except HTTPException:
        raise
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@router.post('/delete_scenario')
async def delete_scenario(scenario_raw: dict, background_tasks: BackgroundTasks):
    conn = None
    cursor = None

    try:
        if 'scenario_id' not in scenario_raw:
            raise HTTPException(status_code=400, detail="Field 'scenario_id' is required")

        conn = get_db_connection()
        cursor = conn.cursor()

        scenario_id = scenario_raw['scenario_id']

        query = "DELETE FROM scenarios WHERE scenario_id = %s"
        cursor.execute(query, (scenario_id,))

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Scenario not found")

        conn.commit()

        background_tasks.add_task(log_action, "delete_scenario", str())

        return {"status": "success", "message": "Scenario deleted", "scenario_id": str()}

    except HTTPException:
        raise
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor: cursor.close()
        if conn: conn.close()
