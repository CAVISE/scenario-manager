export interface SimulationStatus {
  running: boolean;
  status: 'idle' | 'running' | 'stopping' | 'finished' | 'error';
  error: string | null;
  map: string | null;
  run_id: string | null;
  tick?: number;
  max_ticks?: number;
  partial?: boolean;
}
