"""CARLA OpenDRIVE standalone-world generation policy."""

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class OpenDriveGenerationProfile:
    vertex_distance: float = 2.0
    max_road_length: float = 50.0
    wall_height: float = 1.0
    additional_width: float = 0.6
    smooth_junctions: bool = True
    enable_mesh_visibility: bool = True


_OSM_DERIVED_MAPS = frozenset({"osm-area", "osm-area-20261021"})


def generation_profile(map_name: str) -> OpenDriveGenerationProfile:
    """Return the safe CARLA mesh-generation settings for a known map family."""
    normalized = map_name.removesuffix(".xodr").lower()
    if normalized in _OSM_DERIVED_MAPS:
        # OSM conversion commonly represents opposing directions as separate
        # roads. CARLA's default boundary walls can then overlap and collide
        # with actors at junctions.
        return OpenDriveGenerationProfile(wall_height=0.0)
    return OpenDriveGenerationProfile()


def generate_world(
    client: Any,
    carla_api: Any,
    xodr: str,
    map_name: str,
    readiness_timeout_seconds: float,
) -> Any:
    """Generate a custom world and wait for its first ready snapshot."""
    profile = generation_profile(map_name)
    parameters = carla_api.OpendriveGenerationParameters(
        profile.vertex_distance,
        profile.max_road_length,
        profile.wall_height,
        profile.additional_width,
        profile.smooth_junctions,
        profile.enable_mesh_visibility,
    )
    client.generate_opendrive_world(xodr, parameters)

    world = client.get_world()
    if world.wait_for_tick(readiness_timeout_seconds) is None:
        raise RuntimeError(
            f"CARLA OpenDRIVE world '{map_name}' did not become ready within "
            f"{readiness_timeout_seconds:.0f}s"
        )
    return world
