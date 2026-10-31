import cv2

from opencda.core.common import opencv_utils


def test_destroy_all_windows_ignores_missing_highgui_support(monkeypatch):
    def unavailable():
        raise cv2.error("The function is not implemented")

    monkeypatch.setattr(opencv_utils.cv2, "destroyAllWindows", unavailable)

    opencv_utils.destroy_all_windows_safely()


def test_destroy_all_windows_calls_opencv_when_available(monkeypatch):
    calls = []
    monkeypatch.setattr(
        opencv_utils.cv2, "destroyAllWindows", lambda: calls.append(True)
    )

    opencv_utils.destroy_all_windows_safely()

    assert calls == [True]
