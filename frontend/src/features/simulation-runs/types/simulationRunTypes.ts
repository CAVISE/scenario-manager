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

export interface RunArtifact {
  filename: string;
  url: string;
  size_bytes: number;
  content_type?: string | null;
  kind: 'image' | 'log' | 'configuration' | 'data' | 'file';
  modified_at?: number | null;
}

export interface SimulationRunDetail extends SimulationRun {
  created_at?: number | null;
  configuration: Record<string, unknown>;
  artifacts: RunArtifact[];
  has_results: boolean;
}

export interface StopRunResponse {
  status: 'stopping' | 'cancelled';
  run_id?: string | null;
}
