import { useEffect, useRef, useState } from 'react';
import { API_URL } from '../../../../../../VARS';

export interface SimulationStatus {
  running: boolean;
  status: 'idle' | 'running' | 'stopping' | 'finished' | 'error';
  error: string | null;
  map: string | null;
  run_id: string | null;
}

const WS_URL = API_URL.replace(/^http/, 'ws') + '/api/ws/simulation';

const RECONNECT_DELAY_MS = 3_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

export function useSimulationSocket() {
  const [state, setState] = useState<SimulationStatus | null>(null);
  const [connected, setConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectDelay = useRef(RECONNECT_DELAY_MS);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmounted = useRef(false);

  useEffect(
    () => {
      unmounted.current = false;

      function connect() {
        if (unmounted.current) return;

        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          if (unmounted.current) return;
          setConnected(true);
          reconnectDelay.current = RECONNECT_DELAY_MS;
        };

        ws.onmessage = (event) => {
          try {
            const data: SimulationStatus = JSON.parse(event.data);
            setState(data);
          } catch (e) {
            console.error('Failed to parse simulation status:', e);
          }
        };

        ws.onclose = () => {
          if (unmounted.current) return;
          setConnected(false);
          wsRef.current = null;

          reconnectTimer.current = setTimeout(() => {
            reconnectDelay.current = Math.min(
              reconnectDelay.current * 2,
              MAX_RECONNECT_DELAY_MS,
            );
            connect();
          }, reconnectDelay.current);
        };

        ws.onerror = () => {
          ws.close();
        };
      }

      connect();

      return () => {
        unmounted.current = true;
        if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
        wsRef.current?.close();
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return { state, connected };
}
