"""Stable application-facing boundary for OpenCDA configuration handling.

The implementation remains in ``app.opencda_config`` during the staged move so
existing tooling and external imports keep working. New application code must
use this module instead of reaching into the legacy root module.
"""

from app.opencda_config import (
    MAX_OPEN_CDA_CONFIG_LENGTH,
    OpenCDAConfigError,
    compile_open_cda_config,
    parse_open_cda_yaml,
    validate_config_object_counts,
    write_open_cda_artifacts,
)
from app.integrations.opencda.environment import (
    apply_environment_overrides,
    weather_report,
)

__all__ = [
    "MAX_OPEN_CDA_CONFIG_LENGTH",
    "OpenCDAConfigError",
    "apply_environment_overrides",
    "compile_open_cda_config",
    "parse_open_cda_yaml",
    "validate_config_object_counts",
    "weather_report",
    "write_open_cda_artifacts",
]
