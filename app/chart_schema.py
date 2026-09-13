"""Versioned, file-backed chart API. Coordinates are always in original units."""
from typing import Literal

from pydantic import BaseModel, Field, FiniteFloat

CHARTS_NAME = "charts.json"


class ChartAxis(BaseModel):
    label: str
    unit: str = ""


class ChartSeries(BaseModel):
    id: str
    label: str
    points: list[tuple[FiniteFloat, FiniteFloat | None]]


class ResultChart(BaseModel):
    id: str
    actor_id: str
    title: str
    description: str = ""
    category: Literal["motion", "localization", "safety", "cooperation", "platooning"]
    kind: Literal["line", "step", "trajectory"] = "line"
    x_axis: ChartAxis
    y_axis: ChartAxis
    series: list[ChartSeries]


class ResultMetric(BaseModel):
    id: str
    label: str
    value: FiniteFloat | None
    unit: str = ""


class ResultActor(BaseModel):
    id: str
    label: str
    metrics: list[ResultMetric] = Field(default_factory=list)


class ChartDocument(BaseModel):
    schema_version: Literal[1] = 1
    run_id: str
    fixed_delta_seconds: FiniteFloat = Field(gt=0)
    elapsed_seconds: FiniteFloat = Field(ge=0)
    actors: list[ResultActor]
    charts: list[ResultChart]
    warnings: list[str] = Field(default_factory=list)
