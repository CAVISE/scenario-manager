"""Problems found in a scenario config before it is sent to the fork."""

from dataclasses import dataclass
from enum import StrEnum

ConfigPath = tuple[str | int, ...]


class Severity(StrEnum):
    ERROR = "error"
    WARNING = "warning"


@dataclass(frozen=True)
class ConfigIssue:
    """One problem in a config.

    Errors are what the fork rejects or crashes on. Warnings are settings the
    fork accepts but ignores or silently changes.
    """

    code: str
    message: str
    path: ConfigPath = ()
    severity: Severity = Severity.ERROR


def error(code: str, message: str, path: ConfigPath = ()) -> ConfigIssue:
    return ConfigIssue(code, message, path, Severity.ERROR)


def warning(code: str, message: str, path: ConfigPath = ()) -> ConfigIssue:
    return ConfigIssue(code, message, path, Severity.WARNING)
