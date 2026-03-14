export interface EditorModalsProps {
  telemetryModalOpen: boolean;
  simulationConfirmOpen: boolean;
  onCloseTelemetry: () => void;
  onCloseSimulationConfirm: () => void;
  onStartSimulation: () => void;
}