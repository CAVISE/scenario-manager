from collections.abc import Iterator, Mapping

from app.integrations.opencda.fork.effective import EffectiveConfig
from app.integrations.opencda.fork.issues import ConfigIssue, error
from app.integrations.opencda.fork.rules.base import as_float


class TrafficManagerRule:
    """Background traffic spawned through the CARLA Traffic Manager.

    A list in vehicle_list spawns exactly those vehicles. Otherwise the fork
    spawns vehicles in range and only then reads range and cav_spawn_clearance.
    """

    def check(self, config: EffectiveConfig) -> Iterator[ConfigIssue]:
        traffic = config.root.get("carla_traffic_manager")
        if not isinstance(traffic, Mapping) or isinstance(
            traffic.get("vehicle_list"), list
        ):
            return
        path = ("carla_traffic_manager",)
        if not isinstance(traffic.get("range"), list):
            yield error(
                "carla_traffic_manager.range",
                "range must be a list when vehicle_list is not a list.",
                (*path, "range"),
            )
        clearance = as_float(traffic.get("cav_spawn_clearance", 0))
        if clearance is None or clearance < 0:
            yield error(
                "carla_traffic_manager.cav_spawn_clearance",
                "cav_spawn_clearance must be a non-negative number.",
                (*path, "cav_spawn_clearance"),
            )
