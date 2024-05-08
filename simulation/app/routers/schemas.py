from typing import List
from pydantic import BaseModel

class LocationSchema(BaseModel):
    x: float
    y: float
    z: float

class PathSchema(BaseModel):
    path: List[LocationSchema]
