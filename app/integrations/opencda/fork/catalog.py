"""Pinned description of what the CAVISE/OpenCDA fork accepts.

The data lives in ``data/`` and is copied from one fork commit. When the fork
exposes it over its API, only ``load_fork_catalog`` needs to change.
"""

from collections.abc import Mapping
from dataclasses import dataclass, field
from functools import cache
from pathlib import Path
from typing import Any

import yaml

DATA_DIR = Path(__file__).parent / "data"


@dataclass(frozen=True)
class ServiceSpec:
    name: str
    params: frozenset[str]
    ignores_unknown_params: bool = False
    requires: frozenset[str] = frozenset()
    # Services required only when the named parameter is not set.
    requires_unless: Mapping[str, frozenset[str]] = field(default_factory=dict)


@dataclass(frozen=True)
class ServiceRequirement:
    node_type: str
    service: str


@dataclass(frozen=True)
class AttackSpec:
    name: str
    requires: tuple[ServiceRequirement, ...]


@dataclass(frozen=True)
class ForkCatalog:
    commit: str
    defaults: Mapping[str, Any]
    services: Mapping[str, ServiceSpec]
    attacks: Mapping[str, AttackSpec]
    ignored_root_keys: Mapping[str, str]
    ignored_agent_keys: Mapping[str, str]


def _service(name: str, raw: Mapping[str, Any]) -> ServiceSpec:
    return ServiceSpec(
        name=name,
        params=frozenset(raw.get("params", ())),
        ignores_unknown_params=bool(raw.get("ignores_unknown_params", False)),
        requires=frozenset(raw.get("requires", ())),
        requires_unless={
            param: frozenset(services)
            for param, services in (raw.get("requires_unless") or {}).items()
        },
    )


def _attack(name: str, raw: Mapping[str, Any]) -> AttackSpec:
    return AttackSpec(
        name=name,
        requires=tuple(
            ServiceRequirement(item["node_type"], item["service"])
            for item in raw.get("requires", ())
        ),
    )


def load_fork_catalog(data_dir: Path = DATA_DIR) -> ForkCatalog:
    catalog = yaml.safe_load((data_dir / "catalog.yaml").read_text(encoding="utf-8"))
    defaults = yaml.safe_load((data_dir / "default.yaml").read_text(encoding="utf-8"))
    ignored = catalog.get("ignored_keys") or {}
    return ForkCatalog(
        commit=catalog["source"]["commit"],
        defaults=defaults,
        services={
            name: _service(name, raw) for name, raw in catalog["services"].items()
        },
        attacks={name: _attack(name, raw) for name, raw in catalog["attacks"].items()},
        ignored_root_keys=ignored.get("root") or {},
        ignored_agent_keys=ignored.get("agent") or {},
    )


@cache
def default_fork_catalog() -> ForkCatalog:
    return load_fork_catalog()
