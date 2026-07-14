import hashlib
import json
from pathlib import Path
from types import SimpleNamespace
import pytest
import yaml
from omegaconf import OmegaConf

from app.opencda_config import (
    OpenCDAConfigError,
    compile_open_cda_config,
    parse_open_cda_yaml,
    write_open_cda_artifacts,
)


def _scenario_payload(config_yaml: str) -> dict:
    return {
        "map": "Town01",
        "map_offsets": {"x": 0, "y": 0},
        "scenario_name": "Canonical config test",
        "opencda_config_yaml": config_yaml,
        "scenario": [
            {
                "vehicle": "car",
                "path": [
                    {
                        "x": 0,
                        "y": 0,
                        "z": 0,
                        "points": [{"x": 10, "y": 0, "z": 0}],
                    }
                ],
            }
        ],
    }


def test_parser_rejects_incomplete_config(open_cda_config_factory):
    config = open_cda_config_factory()
    del config["vehicle_base"]

    with pytest.raises(OpenCDAConfigError, match="vehicle_base"):
        parse_open_cda_yaml(yaml.safe_dump(config, sort_keys=False))


def test_parser_rejects_unsafe_yaml():
    with pytest.raises(OpenCDAConfigError, match="Invalid OpenCDA YAML"):
        parse_open_cda_yaml("!!python/object/apply:os.system ['echo unsafe']")


def test_parser_rejects_unsupported_interpolation(open_cda_config_factory):
    config = open_cda_config_factory()
    config["vehicle_base"]["controller"]["dt"] = "${oc.env:HOME}"

    with pytest.raises(OpenCDAConfigError, match="Unsupported OmegaConf"):
        parse_open_cda_yaml(yaml.safe_dump(config, sort_keys=False))


def test_parser_rejects_legacy_attack_wrapper(open_cda_config_factory):
    config = open_cda_config_factory(attacks=[{"attack": {"type": "spoofer"}}])

    with pytest.raises(OpenCDAConfigError, match="legacy wrapper"):
        parse_open_cda_yaml(yaml.safe_dump(config, sort_keys=False))


def test_runtime_config_uses_yaml_then_environment_overrides(
    open_cda_config_factory,
):
    config = open_cda_config_factory()
    config["vehicle_base"]["behavior"]["max_speed"] = 31
    config_yaml = yaml.safe_dump(config, sort_keys=False)
    settings = SimpleNamespace(carla_port=2345, base_dir=Path.cwd())

    scene, pedestrians, overrides = compile_open_cda_config(
        _scenario_payload(config_yaml),
        settings,
    )

    assert pedestrians == []
    assert scene.vehicle_base.behavior.max_speed == 31
    assert scene.world.town == "Town01"
    assert scene.world.client_port == 2345
    assert scene.scenario.single_cav_list[0].spawn_position[:3] == [0, 0, 0.5]
    assert {item["path"] for item in overrides} >= {
        "world.town",
        "world.client_port",
        "scenario.single_cav_list[0].spawn_position",
    }


def test_config_artifacts_preserve_exact_source(open_cda_yaml, tmp_path):
    scene = OmegaConf.create(parse_open_cda_yaml(open_cda_yaml))
    overrides = [{"path": "world.client_port", "source": 2000, "effective": 2345}]

    write_open_cda_artifacts(tmp_path, open_cda_yaml, scene, overrides)

    assert (tmp_path / "source_config.yaml").read_bytes() == open_cda_yaml.encode(
        "utf-8"
    )
    metadata = json.loads((tmp_path / "config_overrides.json").read_text("utf-8"))
    assert (
        metadata["source_sha256"]
        == hashlib.sha256(open_cda_yaml.encode("utf-8")).hexdigest()
    )
    assert metadata["overrides"] == overrides
    effective = yaml.safe_load((tmp_path / "effective_config.yaml").read_text("utf-8"))
    assert effective["vehicle_base"]["behavior"]["max_speed"] == 45
