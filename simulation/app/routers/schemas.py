from typing import List, Optional
from pydantic import BaseModel


class LocationSchema(BaseModel):
    x: float
    y: float
    z: float


class PathSchema(BaseModel):
    path: List[LocationSchema]


class CarSchema(BaseModel):
    brand: str
    model: str

class Color(BaseModel):
    r: int = 0
    g: int = 0
    b: int = 0

class ActorScenario(PathSchema):
    vehicle: str
    color: Color
    active: Optional[bool]
    # path: PathSchema


class ScenarioSchema(BaseModel):
    scenario_name: Optional[str]
    map_name: Optional[str]
    weather: Optional[str]
    scenario: List[ActorScenario]


class LocationSchema(BaseModel):
    x: float
    y: float
    z: float


class TransformSchema(LocationSchema):
    pitch: float
    yaw: float
    roll: float
