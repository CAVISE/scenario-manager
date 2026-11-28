from dataclasses import replace
from pathlib import Path

import pytest
import yaml

from app.integrations.opencda.fork.catalog import default_fork_catalog
from app.integrations.opencda.fork.issues import ConfigIssue, Severity
from app.integrations.opencda.fork.validator import create_fork_validator

# Scenario examples copied from CAVISE/OpenCDA at the commit in catalog.yaml.
FORK_EXAMPLES = Path(__file__).parent / "fixtures" / "opencda_fork"
SM_RUNTIME_CONFIG = (
    Path(__file__).parents[2]
    / "contracts"
    / "opencda"
    / "representative-runtime-config.yaml"
)


def _load(path: Path) -> dict:
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def _errors(issues: list[ConfigIssue]) -> list[ConfigIssue]:
    return [issue for issue in issues if issue.severity is Severity.ERROR]


def _warnings(issues: list[ConfigIssue]) -> list[ConfigIssue]:
    return [issue for issue in issues if issue.severity is Severity.WARNING]


def _found(issues: list[ConfigIssue]) -> set[tuple[str, tuple]]:
    return {(issue.code, issue.path) for issue in issues}


def _cav(agent_id: int = 1, **extra) -> dict:
    return {
        "id": agent_id,
        "spawn_position": [0, 0, 0.3, 0, 0, 0],
        "destination": [50, 0, 0.3],
        **extra,
    }


def _rsu(agent_id: int = 1, **extra) -> dict:
    return {"id": agent_id, "spawn_position": [10, 10, 3, 0, 0, 0], **extra}


def _scenario(cavs=None, rsus=None, **sections) -> dict:
    return {
        **sections,
        "scenario": {
            "single_cav_list": [_cav()] if cavs is None else cavs,
            "rsu_list": [] if rsus is None else rsus,
        },
    }


def _validator_with_defaults(**sections):
    """A validator whose default.yaml has the given top-level sections replaced."""
    catalog = default_fork_catalog()
    defaults = {**catalog.defaults, **sections}
    return create_fork_validator(replace(catalog, defaults=defaults)).validate


@pytest.fixture(scope="module")
def validate():
    return create_fork_validator().validate


def test_catalog_matches_fork_commit():
    catalog = default_fork_catalog()

    assert catalog.commit == "1ee39adb155754ebe16c3aeb008594f26a22cc5c"
    assert set(catalog.services) == {
        "self_informer",
        "default_movement_request",
        "movement_controller",
        "aim_client",
        "aim_server",
    }
    assert len(catalog.attacks) == 10
    assert catalog.defaults["agent_base"]["behavior_services"] == {"self_informer": {}}


@pytest.mark.parametrize(
    "example",
    [
        "2cars_2rsu_coperception.yaml",
        "aim_check.yaml",
        "single_town05_cosim.yaml",
    ],
)
def test_fork_examples_have_no_errors(validate, example):
    assert _errors(validate(_load(FORK_EXAMPLES / example))) == []


def test_fork_example_with_active_perception_does_not_run(validate):
    issues = _errors(validate(_load(FORK_EXAMPLES / "single_town06_carla.yaml")))

    assert [issue.code for issue in issues] == ["sensing.perception.activate"]


def test_current_sm_output_loads_but_has_ignored_settings(validate):
    issues = validate(_load(SM_RUNTIME_CONFIG))

    assert _errors(issues) == []
    assert _found(_warnings(issues)) >= {
        ("agent.id", ("scenario", "rsu_list", 0, "id")),
        ("map_manager.activate", ("vehicle_base", "map_manager", "activate")),
        ("config.ignored", ("traffic_manager",)),
        ("config.ignored", ("carla_traffic_manager", "port")),
        ("config.ignored", ("vehicle_base", "v2x")),
        (
            "config.ignored",
            ("vehicle_base", "sensing", "localization", "navigation_source"),
        ),
    }


def test_sm_service_list_cannot_be_merged(validate):
    config = _scenario(
        rsus=[_rsu(behavior_services=[{"type": "aim_server"}])],
    )

    assert _found(validate(config)) == {
        ("config.merge", ("scenario", "rsu_list", 0, "behavior_services"))
    }


def test_merge_conflicts_of_all_agents_are_reported(validate):
    services = [{"type": "self_informer"}]
    config = _scenario(
        cavs=[_cav(1, behavior_services=services), _cav(2)],
        rsus=[_rsu(behavior_services=services)],
    )

    assert _found(validate(config)) == {
        ("config.merge", ("scenario", "single_cav_list", 0, "behavior_services")),
        ("config.merge", ("scenario", "rsu_list", 0, "behavior_services")),
    }


def test_list_replaces_list(validate):
    config = _scenario(carla_traffic_manager={"range": [[0, 1, 0, 1, 1, 1, 1]]})

    assert validate(config) == []


def test_unresolvable_interpolation_is_reported_with_list_index(validate):
    config = _scenario(cavs=[_cav(model="${world.missing}")])

    assert _found(validate(config)) == {
        ("config.invalid", ("scenario", "single_cav_list", 0, "model"))
    }


@pytest.mark.parametrize("root", ["scenario", [1, 2]])
def test_config_root_must_be_a_mapping(validate, root):
    assert [issue.code for issue in validate(root)] == ["config.type"]


def test_minimal_scenario_is_valid(validate):
    assert validate(_scenario(rsus=[_rsu()])) == []


@pytest.mark.parametrize(
    ("world", "code"),
    [
        ({"sync_mode": False}, "world.sync_mode"),
        ({"max_substeps": 17}, "world.max_substeps"),
        ({"fixed_delta_seconds": 0}, "world.fixed_delta_seconds"),
        ({"fixed_delta_seconds": 0.2}, "world.physics"),
        ({"tile_stream_distance": 100}, "world.actor_active_distance"),
        ({"spectator_as_ego": "yes"}, "world.spectator_as_ego"),
    ],
)
def test_world_rules(validate, world, code):
    assert [issue.code for issue in validate(_scenario(world=world))] == [code]


def test_physics_limit_is_skipped_without_substepping(validate):
    world = {"fixed_delta_seconds": 0.2, "substepping": False}

    assert validate(_scenario(world=world)) == []


def test_numeric_strings_are_read_like_the_fork(validate):
    world = {"fixed_delta_seconds": "0.05", "max_substep_delta_time": "0.01"}

    assert validate(_scenario(world=world)) == []


def test_destination_is_optional_with_carla_autopilot(validate):
    without_destination = _cav()
    del without_destination["destination"]

    assert _found(validate(_scenario(cavs=[without_destination]))) == {
        ("agent.destination", ("scenario", "single_cav_list", 0, "destination"))
    }
    assert (
        validate(_scenario(cavs=[{**without_destination, "carla_autopilot": True}]))
        == []
    )


def test_carla_autopilot_falls_back_to_behavior():
    vehicle_base = dict(default_fork_catalog().defaults["vehicle_base"])
    del vehicle_base["carla_autopilot"]
    validate = _validator_with_defaults(vehicle_base=vehicle_base)
    config = _scenario(
        vehicle_base={"behavior": {"carla_autopilot": "yes"}},
    )

    assert _found(validate(config)) == {
        ("agent.carla_autopilot", ("vehicle_base", "behavior", "carla_autopilot"))
    }


def test_spawn_position_needs_six_numbers(validate):
    config = _scenario(
        cavs=[_cav(spawn_position=[0, 0, 0])],
        rsus=[_rsu(spawn_position=[0, 0, "x", 0, 0, 0])],
    )

    assert {issue.code for issue in validate(config)} == {"agent.spawn_position"}
    assert len(validate(config)) == 2


def test_agent_ids_are_unique_per_agent_type(validate):
    config = _scenario(cavs=[_cav(1), _cav(1)], rsus=[_rsu(1), _rsu(-1)])

    assert _found(validate(config)) == {
        ("agent.id_duplicate", ("scenario", "single_cav_list", 1, "id")),
        ("agent.id", ("scenario", "rsu_list", 1, "id")),
    }


def test_inherited_problem_is_reported_once_where_it_is_set(validate):
    config = _scenario(
        cavs=[_cav(1), _cav(2)],
        vehicle_base={"sensing": {"perception": {"activate": True}}},
    )

    assert _found(validate(config)) == {
        (
            "sensing.perception.activate",
            ("vehicle_base", "sensing", "perception", "activate"),
        )
    }


@pytest.mark.parametrize(
    ("localization", "code"),
    [
        ({"provider": "gnss"}, "sensing.localization.provider"),
        ({"provider": "sensor", "estimator": "ukf"}, "sensing.localization.estimator"),
        ({"activate": "true"}, "sensing.localization.provider"),
    ],
)
def test_localization_rules(validate, localization, code):
    config = _scenario(cavs=[_cav(sensing={"localization": localization})])

    assert [issue.code for issue in validate(config)] == [code]


def test_estimator_is_not_used_with_ground_truth(validate):
    config = _scenario(
        cavs=[_cav(sensing={"localization": {"provider": "gt", "estimator": "ukf"}})]
    )

    assert validate(config) == []


def test_map_manager_mode(validate):
    invalid = _scenario(cavs=[_cav(map_manager={"mode": "bev"})])
    legacy = _scenario(cavs=[_cav(map_manager={"activate": True})])

    assert [issue.code for issue in validate(invalid)] == ["map_manager.mode"]
    assert [(issue.code, issue.severity) for issue in validate(legacy)] == [
        ("map_manager.activate", Severity.WARNING)
    ]


def test_unknown_service_and_parameter(validate):
    config = _scenario(
        cavs=[
            _cav(
                behavior_services={
                    "teleport": {},
                    "movement_controller": {"speed": 1},
                }
            )
        ]
    )
    services = ("scenario", "single_cav_list", 0, "behavior_services")

    assert _found(validate(config)) == {
        ("behavior_services.unknown", (*services, "teleport")),
        (
            "behavior_services.param_unknown",
            (*services, "movement_controller", "speed"),
        ),
    }


def test_inherited_service_cannot_be_removed(validate):
    config = _scenario(cavs=[_cav(behavior_services={"movement_controller": None})])

    assert [issue.code for issue in validate(config)] == ["behavior_services.params"]


def test_aim_server_ignores_unknown_model_parameters(validate):
    config = _scenario(
        rsus=[_rsu(behavior_services={"aim_server": {"weight": "a.pth"}})]
    )

    assert [(issue.code, issue.severity) for issue in validate(config)] == [
        ("behavior_services.param_ignored", Severity.WARNING)
    ]


def test_aim_server_model_must_be_registered(validate):
    config = _scenario(rsus=[_rsu(behavior_services={"aim_server": {"model": "GNN"}})])

    assert _found(validate(config)) == {
        (
            "behavior_services.param_value",
            ("scenario", "rsu_list", 0, "behavior_services", "aim_server", "model"),
        )
    }


def test_aim_client_needs_movement_controller(validate):
    config = _scenario(rsus=[_rsu(behavior_services={"aim_client": {}})])

    assert [issue.message for issue in validate(config)] == [
        "'aim_client' requires 'movement_controller' on the same agent."
    ]


def test_aim_server_needs_self_informer_without_control_center():
    validate = _validator_with_defaults(agent_base={})
    location = {"x": 0, "y": 0, "z": 0}

    without_center = _scenario(rsus=[_rsu(behavior_services={"aim_server": {}})])
    with_center = _scenario(
        rsus=[
            _rsu(
                behavior_services={"aim_server": {"control_center_location": location}}
            )
        ]
    )

    assert [issue.code for issue in validate(without_center)] == [
        "behavior_services.requires"
    ]
    assert validate(with_center) == []


def test_attacks_are_names_from_the_catalog(validate):
    config = _scenario(attacks=[{"type": "spoofer"}, "gnss_spoofing"])

    assert _found(validate(config)) == {
        ("attacks.inline", ("attacks", 0)),
        ("attacks.unknown", ("attacks", 1)),
    }


def test_attack_requirements(validate):
    attack = "aim_server_request_ddos"
    aim_cav = _cav(behavior_services={"aim_client": {}})
    aim_rsu = _rsu(
        behavior_services={"aim_server": {"control_center_location": [0, 0, 0]}}
    )

    missing = validate(_scenario(attacks=[attack]))
    satisfied = validate(_scenario(cavs=[aim_cav], rsus=[aim_rsu], attacks=[attack]))

    assert [issue.message for issue in missing] == [
        f"'{attack}' needs a rsu with 'aim_server'.",
        f"'{attack}' needs a vehicle with 'aim_client'.",
    ]
    assert satisfied == []


@pytest.mark.parametrize(
    ("traffic", "code"),
    [
        (
            {"vehicle_list": None, "cav_spawn_clearance": -1},
            "carla_traffic_manager.cav_spawn_clearance",
        ),
        ({"vehicle_list": None, "range": None}, "carla_traffic_manager.range"),
    ],
)
def test_traffic_manager_rules(validate, traffic, code):
    config = _scenario(carla_traffic_manager=traffic)

    assert [issue.code for issue in validate(config)] == [code]


def test_range_settings_are_unused_with_vehicle_list(validate):
    traffic = {"vehicle_list": [], "range": None, "cav_spawn_clearance": -1}

    assert validate(_scenario(carla_traffic_manager=traffic)) == []


def test_platoons_are_rejected(validate):
    config = _scenario()
    config["scenario"]["platoon_list"] = [{"name": "platoon1", "members": []}]

    assert [issue.code for issue in validate(config)] == ["scenario.platoon_list"]


def test_ignored_keys_are_reported_where_they_are_set(validate):
    config = _scenario(
        cavs=[_cav(v2x={"enabled": True})],
        world={"client_host": "carla"},
    )

    assert _found(validate(config)) == {
        ("config.ignored", ("world", "client_host")),
        ("config.ignored", ("scenario", "single_cav_list", 0, "v2x")),
    }
