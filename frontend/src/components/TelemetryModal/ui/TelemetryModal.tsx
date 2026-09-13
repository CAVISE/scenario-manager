import { Box, IconButton, Modal } from '@mui/material';
import { Close } from '@mui/icons-material';
import ResultsWorkspace from '@/components/Results/ResultsWorkspace';
import {
  ModalContainer,
  type TelemetryModalProps,
} from '../types/TelemetryModalTypes';

export default function TelemetryModal({ open, onClose }: TelemetryModalProps) {
  return (
    <Modal open={open} onClose={onClose} aria-label="Simulation results">
      <ModalContainer sx={{ height: '92vh' }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2, pt: 1 }}>
          <IconButton onClick={onClose} aria-label="Close results">
            <Close />
          </IconButton>
        </Box>
        <Box
          sx={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}
        >
          {open && <ResultsWorkspace onOpenContext={onClose} />}
        </Box>
      </ModalContainer>
    </Modal>
  );
}
