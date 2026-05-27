from typing import Any, Optional
from pydantic import BaseModel, Field

class StartSimulationRequest(BaseModel):
    map: str = "Town10HD"
    max_ticks: int = Field(default=1000, ge=1, le=10000)
    scenario_name: str = ""
    description: str = ""
    weather: Optional[str] = None
    scenario: list[dict] = Field(default_factory=list)
    xodr: Optional[str] = None
    scenario_id: Optional[str] = None


class SimulationStatusResponse(BaseModel):
    running: bool
    status: str         
    error: Optional[str]
    map: Optional[str]
    run_id: Optional[str]


class StopSimulationResponse(BaseModel):
    status: str


class StartSimulationResponse(BaseModel):
    status: str
    map: str

class ResultFile(BaseModel):
    filename: str
    url: str


class ResultsResponse(BaseModel):
    files: list[ResultFile]
    run_id: str


class ScenarioSummary(BaseModel):
    id: int
    scenario_id: str
    name: str
    preview: Optional[str]
    annotation: Optional[str]


class ScenarioDetail(BaseModel):
    id: int
    scenario_id: str
    name_of_scenario: str
    scenario_text: Optional[Any]
    preview: Optional[str]
    annotation: Optional[str]
    file_: Optional[str]


class LoadAllScenariosResponse(BaseModel):
    status: str
    count: int
    scenarios: list[ScenarioSummary]


class LoadScenarioResponse(BaseModel):
    status: str
    scenario: ScenarioDetail


class UploadScenarioRequest(BaseModel):
    name_of_scenario: str
    scenario: Optional[dict] = None
    scenario_id: Optional[str] = None
    preview: Optional[str] = None
    description: Optional[str] = None
    file_: Optional[str] = None


class UpdateScenarioRequest(BaseModel):
    scenario_id: str
    scenario_name: Optional[str] = None
    scenario: Optional[dict] = None
    preview: Optional[str] = None
    annotation: Optional[str] = None


class DeleteScenarioRequest(BaseModel):
    scenario_id: str


class ScenarioMutationResponse(BaseModel):
    status: str
    message: str
    scenario_id: Optional[str] = None