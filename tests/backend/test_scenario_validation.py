import pytest
from pydantic import ValidationError

from app.schemas import (
    DeleteScenarioRequest,
    StartSimulationRequest,
    UploadScenarioRequest,
)


def test_upload_rejects_empty_name():
    with pytest.raises(ValidationError):
        UploadScenarioRequest(name_of_scenario="   ")


def test_upload_rejects_invalid_scenario_id():
    with pytest.raises(ValidationError):
        UploadScenarioRequest(
            name_of_scenario="Test",
            scenario_id="bad id!",
        )


def test_upload_accepts_opendrive_in_file_field():
    body = UploadScenarioRequest(
        name_of_scenario="Test",
        file_="<?xml version='1.0'?><OpenDRIVE></OpenDRIVE>",
    )
    assert body.file_.startswith("<?xml")


def test_upload_rejects_file_name_in_file_field():
    with pytest.raises(ValidationError):
        UploadScenarioRequest(name_of_scenario="Test", file_="Town10HD.xodr")


def test_upload_rejects_invalid_vehicle_type():
    with pytest.raises(ValidationError):
        UploadScenarioRequest(
            name_of_scenario="Test",
            scenario=[{"vehicle": "truck", "path": [{"x": 0, "y": 0, "z": 0}]}],
        )


def test_delete_requires_valid_scenario_id():
    with pytest.raises(ValidationError):
        DeleteScenarioRequest(scenario_id="")


def test_start_simulation_requires_car_with_route(open_cda_yaml):
    with pytest.raises(ValidationError):
        StartSimulationRequest(
            map="Town10HD",
            opencda_config_yaml=open_cda_yaml,
            scenario=[{"vehicle": "car", "path": [{"x": 0, "y": 0, "z": 0}]}],
        )


def test_start_simulation_requires_open_cda_yaml():
    with pytest.raises(ValidationError):
        StartSimulationRequest(
            map="Town10HD",
            scenario=[
                {
                    "vehicle": "car",
                    "path": [
                        {
                            "x": 0,
                            "y": 0,
                            "z": 0,
                            "points": [{"x": 10, "y": 0, "z": 0}],
                        }
                    ],
                }
            ],
        )


def test_start_simulation_accepts_valid_payload(open_cda_yaml):
    body = StartSimulationRequest(
        map="Town10HD",
        opencda_config_yaml=open_cda_yaml,
        scenario=[
            {
                "vehicle": "car",
                "path": [
                    {
                        "x": 0,
                        "y": 0,
                        "z": 0,
                        "points": [{"id": 0, "x": 10, "y": 0, "z": 0}],
                    }
                ],
            }
        ],
    )
    assert body.map == "Town10HD"
