import React from 'react';
import { Modal, Box, Typography, Button } from '@mui/material';
import TelemetryModal from '../../../../components/TelemetryModal';
import{ EditorModalButtonStyles, EditorModalsStyles, TelemetryModalStyles, type EditorModalsProps } from './types/EditorModalsTypes';

export const EditorModals: React.FC<EditorModalsProps> = ({
  telemetryModalOpen,
  simulationConfirmOpen,
  onCloseTelemetry,
  onCloseSimulationConfirm,
  onStartSimulation,
}) => {
  return (
    <>
      <TelemetryModal
        open={telemetryModalOpen}
        onClose={onCloseTelemetry}
      />
      <Modal
        open={simulationConfirmOpen}
        onClose={onCloseSimulationConfirm}
        aria-labelledby="simulation-confirm-title"
        aria-describedby="simulation-confirm-description"
      >
        <Box sx={EditorModalsStyles}>
          <Typography id="simulation-confirm-title" variant="h6" component="h2" gutterBottom>
            Confirmation
          </Typography>
          <Typography id="simulation-confirm-description" sx={TelemetryModalStyles}>
            Are you sure you want to run the simulation?
          </Typography>
          <Button
            variant="contained"
            onClick={onStartSimulation}
            sx={EditorModalButtonStyles}
          >
            Run
          </Button>
        </Box>
      </Modal>
    </>
  );
};
