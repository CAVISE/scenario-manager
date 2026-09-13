export interface ResultMetric {
  id: string;
  label: string;
  value: number | null;
  unit: string;
}

export interface ResultActor {
  id: string;
  label: string;
  metrics: ResultMetric[];
}

export interface ResultChart {
  id: string;
  actor_id: string;
  title: string;
  description: string;
  category: 'motion' | 'localization' | 'safety' | 'cooperation' | 'platooning';
  kind: 'line' | 'step' | 'trajectory';
  x_axis: { label: string; unit: string };
  y_axis: { label: string; unit: string };
  series: Array<{
    id: string;
    label: string;
    points: Array<[number, number | null]>;
  }>;
}

export interface ChartDocument {
  schema_version: 1;
  run_id: string;
  fixed_delta_seconds: number;
  elapsed_seconds: number;
  actors: ResultActor[];
  charts: ResultChart[];
  warnings: string[];
}

export interface ResultRun {
  run_id: string;
  files_count: number;
  modified_at: number;
  scenario_name?: string | null;
  outcome?: string;
  is_demo?: boolean;
  tick?: number | null;
  max_ticks?: number | null;
}

export interface ResultResponse {
  run_id: string;
  files: Array<{ filename: string; url: string }>;
  data?: ChartDocument | null;
  data_error?: string | null;
}
