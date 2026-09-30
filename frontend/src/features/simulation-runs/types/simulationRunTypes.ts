export type SimulationRunStatus =
  | 'queued'
  | 'running'
  | 'stopping'
  | 'finished'
  | 'error'
  | 'cancelled'
  | 'idle';

export interface SimulationRun {
  run_id: string;
  status: SimulationRunStatus;
  running: boolean;
  error?: string | null;
  map?: string | null;
  tick: number;
  max_ticks: number;
  partial: boolean;
  scenario_id?: string | null;
  scenario_name?: string | null;
  modified_at?: number | null;
  queue_position?: number | null;
}

export interface StopRunResponse {
  status: 'stopping' | 'cancelled';
  run_id?: string | null;
}
