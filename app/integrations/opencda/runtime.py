import threading
from collections.abc import Callable
from typing import Any, TypeVar

Result = TypeVar("Result")


class SetupTimeout(Exception):
    """CARLA setup did not complete before the configured timeout."""


def reset_stale_sync_mode(client: Any, logger: Any) -> None:
    """Clear sync mode left behind by a previously interrupted run."""
    try:
        world = client.get_world()
        current = world.get_settings()
    except Exception as error:
        logger.warning(
            "Preflight sync-mode check failed (continuing anyway): %s", error
        )
        return

    if not current.synchronous_mode:
        return
    logger.warning(
        "CARLA server was already in synchronous_mode before this run started; "
        "forcing asynchronous mode before setup."
    )
    try:
        current.synchronous_mode = False
        current.fixed_delta_seconds = None
        world.apply_settings(current)
        logger.info("Stale synchronous_mode cleared.")
    except Exception as error:
        logger.error("Failed to clear stale synchronous_mode: %s", error)


def run_with_timeout(
    operation: Callable[[], Result], timeout_seconds: float, description: str
) -> Result:
    """Wait for a blocking CARLA setup call without hanging the run forever."""
    result: dict[str, Any] = {}

    def target() -> None:
        try:
            result["value"] = operation()
        except BaseException as error:
            result["error"] = error

    thread = threading.Thread(target=target, daemon=True, name=f"setup-{description}")
    thread.start()
    thread.join(timeout_seconds)
    if thread.is_alive():
        raise SetupTimeout(
            f"{description} did not complete within {timeout_seconds:.0f}s — "
            "CARLA connection is likely wedged."
        )
    if "error" in result:
        raise result["error"]
    return result["value"]
