export interface TelemetryModalProps {
  open: boolean;
  onClose: () => void;
}

export type TabCategories = 'routes' | 'telemetry' | 'localization' | 'other';

export type ImagesByTabType = Record<
  TabCategories,
  Array<{ url: string; name: string }>
>;

export interface SimStatus {
  run_id: string | null;
  status: string;
}

export interface FileEntry {
  filename: string;
  url: string;
}

export interface ResultsResponse {
  files: FileEntry[];
  run_id: string;
}
