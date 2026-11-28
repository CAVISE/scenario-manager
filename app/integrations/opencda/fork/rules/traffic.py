from collections.abc import Iterator, Mapping

from app.integrations.opencda.fork.effective import EffectiveConfig
from app.integrations.opencda.fork.issues import ConfigIssue, error
from app.integrations.opencda.fork.rules.base import is_number


class TrafficManagerRule:
    """Background traffic spawned through the CARLA Traffic Manager."""

    def check(self, config: EffectiveConfig) -> Iterator[ConfigIssue]:
        traffic = config.root.get("carla_traffic_manager")
        if traffic is None:
            return
        path = ("carla_traffic_manager",)
        if not isinstance(traffic, Mapping):
            yield error(
                "carla_traffic_manager.type",
                "carla_traffic_manager must be a mapping.",
                path,
            )
            return

        clearance = traffic.get("cav_spawn_clearance", 0)
        if not is_number(clearance) or clearance < 0:
            yield error(
                "carla_traffic_manager.cav_spawn_clearance",
                "cav_spawn_clearance must be a non-negative number.",
                (*path, "cav_spawn_clearance"),
            )
        vehicle_list = traffic.get("vehicle_list")
        if vehicle_list is not None and not isinstance(vehicle_list, list):
            yield error(
                "carla_traffic_manager.vehicle_list",
                "vehicle_list must be a list, or null to spawn vehicles in range.",
                (*path, "vehicle_list"),
            )
        if vehicle_list is None and not isinstance(traffic.get("range"), list):
            yield error(
                "carla_traffic_manager.range",
                "range must be a list when vehicle_list is null.",
                (*path, "range"),
            )
