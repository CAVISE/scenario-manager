"""WebSocket subscription management for simulation status updates."""

import asyncio
import threading
from collections.abc import Callable
from typing import Any

from fastapi import WebSocket, WebSocketDisconnect

PayloadFactory = Callable[[], dict[str, Any]]
RunPayloadFactory = Callable[[str], dict[str, Any]]


class SimulationNotifier:
    """Fan out simulation state to global and per-run WebSocket subscribers."""

    def __init__(self, logger: Any) -> None:
        self._logger = logger
        self._lock = threading.Lock()
        self._state_clients: list[WebSocket] = []
        self._run_clients: dict[str, list[WebSocket]] = {}
        self._loop: asyncio.AbstractEventLoop | None = None

    def clear(self) -> None:
        """Drop subscriptions; used by application tests and shutdown hooks."""
        with self._lock:
            self._state_clients.clear()
            self._run_clients.clear()

    def subscribe_state(self, websocket: WebSocket) -> None:
        with self._lock:
            self._state_clients.append(websocket)

    def unsubscribe_state(self, websocket: WebSocket) -> None:
        with self._lock:
            if websocket in self._state_clients:
                self._state_clients.remove(websocket)

    def _subscribe_run(self, run_id: str, websocket: WebSocket) -> None:
        with self._lock:
            self._run_clients.setdefault(run_id, []).append(websocket)

    def _unsubscribe_run(self, run_id: str, websocket: WebSocket) -> None:
        with self._lock:
            clients = self._run_clients.get(run_id, [])
            if websocket in clients:
                clients.remove(websocket)
            if not clients:
                self._run_clients.pop(run_id, None)

    def _register_loop(self) -> None:
        if self._loop is None or self._loop.is_closed():
            self._loop = asyncio.get_running_loop()

    async def serve_state(self, websocket: WebSocket, payload: PayloadFactory) -> None:
        await websocket.accept()
        self._register_loop()
        self.subscribe_state(websocket)
        try:
            await websocket.send_json(payload())
            while True:
                try:
                    await asyncio.wait_for(websocket.receive_text(), timeout=1.0)
                except TimeoutError:
                    await websocket.send_json(payload())
        except WebSocketDisconnect:
            pass
        finally:
            self.unsubscribe_state(websocket)

    async def serve_run(
        self, websocket: WebSocket, run_id: str, payload: PayloadFactory
    ) -> None:
        await websocket.accept()
        self._register_loop()
        self._subscribe_run(run_id, websocket)
        try:
            await websocket.send_json(payload())
            while True:
                try:
                    await asyncio.wait_for(websocket.receive_text(), timeout=1.0)
                except TimeoutError:
                    await websocket.send_json(payload())
        except WebSocketDisconnect:
            pass
        finally:
            self._unsubscribe_run(run_id, websocket)

    async def _send_state(self, websocket: WebSocket, payload: PayloadFactory) -> None:
        try:
            await websocket.send_json(payload())
        except Exception:
            self.unsubscribe_state(websocket)

    async def _send_run_state(
        self, websocket: WebSocket, run_id: str, payload: RunPayloadFactory
    ) -> None:
        try:
            await websocket.send_json(payload(run_id))
        except Exception:
            self._unsubscribe_run(run_id, websocket)

    def broadcast(
        self, state_payload: PayloadFactory, run_payload: RunPayloadFactory
    ) -> None:
        """Schedule a state refresh for every current subscriber."""
        loop = self._loop
        if loop is None or loop.is_closed():
            self._logger.warning("Simulation notifier has no event loop; skipping")
            return

        with self._lock:
            state_clients = list(self._state_clients)
            run_clients = {
                run_id: list(clients) for run_id, clients in self._run_clients.items()
            }

        for websocket in state_clients:
            asyncio.run_coroutine_threadsafe(
                self._send_state(websocket, state_payload), loop
            )
        for run_id, clients in run_clients.items():
            for websocket in clients:
                asyncio.run_coroutine_threadsafe(
                    self._send_run_state(websocket, run_id, run_payload), loop
                )
