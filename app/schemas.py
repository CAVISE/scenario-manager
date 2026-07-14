from typing import Any, Optional, Union

from pydantic import BaseModel, Field, field_validator, model_validator

from app.opencda_config import (
    MAX_OPEN_CDA_CONFIG_LENGTH,
    parse_open_cda_yaml,
    validate_config_object_counts,
)
from app.scenario_validation import (
    extract_scenario_groups,
    validate_file_reference,
    validate_optional_text,
    validate_preview,
    validate_scenario_id,
    validate_scenario_name,
)


class MapOffsets(BaseModel):
    x: float = 0.0
    y: float = 0.0


class StartSimulationRequest(BaseModel):
    map: str = Field(default="Town10HD", min_length=1, max_length=128)
    max_ticks: int = Field(default=1000, ge=1, le=10000)
    map_offsets: MapOffsets = Field(default_factory=MapOffsets)
    scenario_name: str = Field(default="", max_length=200)
    description: str = Field(default="", max_length=4000)
    opencda_config_yaml: str = Field(
        ...,
        min_length=1,
        max_length=MAX_OPEN_CDA_CONFIG_LENGTH,
    )
    weather: Optional[str] = Field(default=None, max_length=64)
    scenario: list[dict] = Field(default_factory=list)
    attacks: list[dict] = Field(default_factory=list)
    xodr: Optional[str] = Field(default=None, max_length=5_000_000)
    scenario_id: Optional[str] = None

    @field_validator("map", mode="before")
    @classmethod
    def validate_map(cls, value: Any) -> str:
        normalized = str(value or "").strip()
        if not normalized:
            raise ValueError("map cannot be empty")
        return normalized.replace(".xodr", "")

    @field_validator("scenario_id", mode="before")
    @classmethod
    def validate_optional_scenario_id(cls, value: Any) -> str | None:
        return validate_scenario_id(value, required=False)

    @field_validator("scenario")
    @classmethod
    def validate_scenario_list(cls, value: list[dict]) -> list[dict]:
        extract_scenario_groups(value)
        cars = [g for g in value if g.get("vehicle") == "car"]
        if not cars:
            raise ValueError("scenario must include at least one car group")
        has_routable_car = any(
            isinstance(car.get("path"), list)
            and any(
                isinstance(point, dict) and isinstance(point.get("points"), list) and point["points"]
                for point in car["path"]
            )
            for car in cars
        )
        if not has_routable_car:
            raise ValueError("at least one car must have route points")
        return value

    @model_validator(mode="after")
    def validate_open_cda_config(self):
        config = parse_open_cda_yaml(self.opencda_config_yaml)
        validate_config_object_counts(config, self.scenario)
        return self


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
    name_of_scenario: str = Field(..., min_length=1, max_length=200)
    scenario: Optional[Union[dict, list]] = None
    scenario_id: Optional[str] = None
    preview: Optional[str] = None
    description: Optional[str] = None
    file_: Optional[str] = None

    @field_validator("name_of_scenario", mode="before")
    @classmethod
    def validate_name(cls, value: Any) -> str:
        return validate_scenario_name(value)

    @field_validator("scenario_id", mode="before")
    @classmethod
    def validate_optional_id(cls, value: Any) -> str | None:
        return validate_scenario_id(value, required=False)

    @field_validator("description", mode="before")
    @classmethod
    def validate_description(cls, value: Any) -> str | None:
        return validate_optional_text(value, field_name="description", max_len=4000)

    @field_validator("preview", mode="before")
    @classmethod
    def validate_preview_field(cls, value: Any) -> str | None:
        return validate_preview(value)

    @field_validator("file_", mode="before")
    @classmethod
    def validate_file_field(cls, value: Any) -> str | None:
        return validate_file_reference(value)

    @field_validator("scenario", mode="before")
    @classmethod
    def validate_scenario_field(cls, value: Any) -> Any:
        extract_scenario_groups(value)
        return value


class UpdateScenarioRequest(BaseModel):
    scenario_id: str = Field(..., min_length=1, max_length=128)
    scenario_name: Optional[str] = Field(default=None, max_length=200)
    scenario: Optional[Union[dict, list]] = None
    preview: Optional[str] = None
    annotation: Optional[str] = None

    @field_validator("scenario_id", mode="before")
    @classmethod
    def validate_required_id(cls, value: Any) -> str:
        result = validate_scenario_id(value, required=True)
        assert result is not None
        return result

    @field_validator("scenario_name", mode="before")
    @classmethod
    def validate_optional_name(cls, value: Any) -> str | None:
        if value is None:
            return None
        return validate_scenario_name(value)

    @field_validator("annotation", mode="before")
    @classmethod
    def validate_annotation(cls, value: Any) -> str | None:
        return validate_optional_text(value, field_name="annotation", max_len=4000)

    @field_validator("preview", mode="before")
    @classmethod
    def validate_preview_field(cls, value: Any) -> str | None:
        return validate_preview(value)

    @field_validator("scenario", mode="before")
    @classmethod
    def validate_scenario_field(cls, value: Any) -> Any:
        if value is not None:
            extract_scenario_groups(value)
        return value


class DeleteScenarioRequest(BaseModel):
    scenario_id: str = Field(..., min_length=1, max_length=128)

    @field_validator("scenario_id", mode="before")
    @classmethod
    def validate_required_id(cls, value: Any) -> str:
        result = validate_scenario_id(value, required=True)
        assert result is not None
        return result


class ScenarioMutationResponse(BaseModel):
    status: str
    message: str
    scenario_id: Optional[str] = None
