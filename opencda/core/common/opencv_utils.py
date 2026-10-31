"""Small OpenCV helpers that are safe in headless simulation containers."""

import cv2


def destroy_all_windows_safely() -> None:
    """Close OpenCV windows when HighGUI is available.

    The Docker image uses a headless OpenCV build.  Its implementation of
    ``destroyAllWindows`` raises ``cv2.error`` even when no visualizer was
    created, which previously made actor cleanup appear to fail.
    """

    try:
        cv2.destroyAllWindows()
    except cv2.error:
        # There are no HighGUI windows in a headless build to clean up.
        pass
