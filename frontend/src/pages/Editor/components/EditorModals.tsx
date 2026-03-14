import React from 'react';
import { Modal, Box, Typography, Button } from '@mui/material';
import TelemetryModal from '../../../components/TelemetryModal';
import type{ EditorModalsProps } from './types/EditorModalsTypes';

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
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          border: '1px solid #ccc',
          boxShadow: 24,
          p: 4,
          textAlign: 'center'
        }}>
          <Typography id="simulation-confirm-title" variant="h6" component="h2" gutterBottom>
            Confirmation
          </Typography>
          <Typography id="simulation-confirm-description" sx={{ mt: 2, mb: 3 }}>
            Are you sure you want to run the simulation?
          </Typography>
          <Button
            variant="contained"
            onClick={onStartSimulation}
            sx={{
              bgcolor: 'error.main',
              '&:hover': { bgcolor: 'error.dark' }
            }}
          >
            Run
          </Button>
        </Box>
      </Modal>
    </>
  );
};
