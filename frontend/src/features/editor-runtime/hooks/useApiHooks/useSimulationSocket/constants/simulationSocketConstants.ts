import { API_URL } from '@/VARS';

const websocketUrl =
  API_URL.replace(/^http/, 'ws').replace(/\/$/, '') + '/api/ws/simulation';

export const SIMULATION_WS_URL = websocketUrl;

export const RECONNECT_DELAY_MS = 3_000;
export const MAX_RECONNECT_DELAY_MS = 30_000;
