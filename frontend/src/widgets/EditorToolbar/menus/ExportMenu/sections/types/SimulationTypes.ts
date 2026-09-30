export interface SimulatorProps {
  openExportDialog: (
    filename: string,
    contentGenerator: (filename: string) => string
  ) => void;
}
