import { API_URL } from '../../../app/vars';

export interface SimulationStatus {
  running: boolean;
  status: 'idle' | 'running' | 'stopping' | 'finished' | 'error';
  error: string | null;
  map: string | null;
  run_id: string | null;
}

export const WS_URL =
  API_URL.replace(/^http/, 'ws').replace(/\/$/, '') + '/api/ws/simulation';

export const RECONNECT_DELAY_MS = 3_000;
export const MAX_RECONNECT_DELAY_MS = 30_000;
