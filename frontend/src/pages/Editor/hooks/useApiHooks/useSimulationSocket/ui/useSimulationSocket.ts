import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '@/store';
import {
  MAX_RECONNECT_DELAY_MS,
  RECONNECT_DELAY_MS,
  SimulationStatus,
  WS_URL,
} from '../types/useSimulationSocketTypes';

export function useSimulationSocket() {
  const [state, setState] = useState<SimulationStatus | null>(null);
  const [connected, setConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectDelay = useRef(RECONNECT_DELAY_MS);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmounted = useRef(false);

  useEffect(() => {
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
          const phase =
            data.status === 'running' || data.status === 'stopping'
              ? 'running'
              : data.status === 'finished'
                ? 'finished'
                : data.status === 'error'
                  ? 'error'
                  : 'idle';
          useEditorStore.getState().updateSimulationSession({
            phase,
            runId: data.run_id,
            status: data.status,
            error: data.error,
            tick: data.tick ?? 0,
            maxTicks: data.max_ticks ?? 0,
            partial: data.partial ?? false,
            ...(phase === 'idle' && { startedAt: null }),
          });
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
            MAX_RECONNECT_DELAY_MS
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
  }, []);

  return { state, connected };
}
