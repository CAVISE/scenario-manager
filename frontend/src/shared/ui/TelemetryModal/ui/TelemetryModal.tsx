import { Box, IconButton, Modal } from '@mui/material';
import { Close } from '@mui/icons-material';
import { ResultsWorkspace } from '@/features/results';
import { type TelemetryModalProps } from '../types/TelemetryModalTypes';
import '../styles/TelemetryModal.scss';

export default function TelemetryModal({ open, onClose }: TelemetryModalProps) {
  return (
    <Modal open={open} onClose={onClose} aria-label="Simulation results">
      <Box className="telemetry-modal__container">
        <Box className="telemetry-modal__close">
          <IconButton onClick={onClose} aria-label="Close results">
            <Close />
          </IconButton>
        </Box>
        <Box className="telemetry-modal__content">
          {open && <ResultsWorkspace onOpenContext={onClose} />}
        </Box>
      </Box>
    </Modal>
  );
}
