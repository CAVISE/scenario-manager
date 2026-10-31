from types import SimpleNamespace

from app.integrations.opencda.opendrive import generate_world, generation_profile


def test_osm_maps_disable_carla_boundary_walls():
    assert generation_profile("osm-area").wall_height == 0.0
    assert generation_profile("osm-area-20261021.xodr").wall_height == 0.0


def test_non_osm_maps_keep_carla_default_wall_height():
    assert generation_profile("Town01").wall_height == 1.0
    assert generation_profile("strogino_modified").wall_height == 1.0


def test_generate_world_passes_profile_and_waits_for_ready_snapshot():
    calls = []

    class Parameters:
        def __init__(self, *args):
            self.args = args

    class World:
        def wait_for_tick(self, timeout):
            calls.append(("wait_for_tick", timeout))
            return object()

    world = World()

    class Client:
        def generate_opendrive_world(self, xodr, parameters):
            calls.append(("generate", xodr, parameters.args))

        def get_world(self):
            return world

    result = generate_world(
        Client(),
        SimpleNamespace(OpendriveGenerationParameters=Parameters),
        "<OpenDRIVE />",
        "osm-area",
        12.0,
    )

    assert result is world
    assert calls == [
        ("generate", "<OpenDRIVE />", (2.0, 50.0, 0.0, 0.6, True, True)),
        ("wait_for_tick", 12.0),
    ]


def test_generate_world_rejects_a_world_that_never_becomes_ready():
    class Parameters:
        def __init__(self, *_args):
            pass

    class World:
        def wait_for_tick(self, _timeout):
            return None

    class Client:
        def generate_opendrive_world(self, _xodr, _parameters):
            pass

        def get_world(self):
            return World()

    try:
        generate_world(
            Client(),
            SimpleNamespace(OpendriveGenerationParameters=Parameters),
            "<OpenDRIVE />",
            "osm-area",
            1.0,
        )
    except RuntimeError as error:
        assert "did not become ready" in str(error)
    else:
        raise AssertionError("Expected world-readiness failure")
