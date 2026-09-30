from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class QueuedSimulation:
    run_id: str
    map_name: str
    scenario_raw: dict[str, Any]
    params: dict[str, Any]
