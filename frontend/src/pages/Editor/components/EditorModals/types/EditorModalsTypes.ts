export interface EditorModalsProps {
  telemetryModalOpen: boolean;
  simulationConfirmOpen: boolean;
  onCloseTelemetry: () => void;
  onCloseSimulationConfirm: () => void;
  onStartSimulation: () => void;
}
export const EditorModalsStyles = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '1px solid #ccc',
  boxShadow: 24,
  p: 4,
  textAlign: 'center',
} as const;

export const EditorModalButtonStyles = {
  bgcolor: 'error.main',
  '&:hover': { bgcolor: 'error.dark' },
} as const;
export const TelemetryModalStyles = { mt: 2, mb: 3 } as const;
