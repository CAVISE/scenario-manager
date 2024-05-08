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

class ActorScenario(BaseModel):
    vehicle: CarSchema
    path: PathSchema

class ScenarioSchema(BaseModel):
    weather: Optional[str]
    scenario: List[ActorScenario]
