import { useState, useCallback } from 'react';
import { Button, Modal, Box, Typography } from '@mui/material';
import TelemetryModal from "../../../components/TelemetryModal";
import { useStartSimulationMutation } from '../hooks/useSimulationMutation';

export const EditorModals = () => {
  const [telemetryModalOpen, setTelemetryModalOpen] = useState(false);
  const [simulationConfirmOpen, setSimulationConfirmOpen] = useState(false);
  const startSimulationMutation = useStartSimulationMutation();

  if (typeof window !== 'undefined') {
    (window as any).editorModals = {
      openTelemetry: () => setTelemetryModalOpen(true),
      openSimulation: () => setSimulationConfirmOpen(true),
    };
  }

  const handleStartSimulation = useCallback(() => {
    const payload = {
      scenario_id: "9959781287",
      scenario_name: "scenario 1",
      weather: "HardRainNoon",
      description: "Generated scenario from SM UI",
      scenario: [{
        path: [{ x: -35, y: 138, z: 0.3 }, { x: 35, y: 10, z: 0.3 }],
        vehicle: "pedestrian" as const,
        color: { r: 127, g: 0, b: 0 },
        active: false
      }],
    };
    startSimulationMutation.mutate(payload, {
      onError: (err) => {
        console.error(err);
        alert('Failed to start simulation.');
      },
    });
    setSimulationConfirmOpen(false);
  }, [startSimulationMutation]);

  return (
    <>
      <TelemetryModal 
        open={telemetryModalOpen} 
        onClose={() => setTelemetryModalOpen(false)} 
      />

      <Modal 
        open={simulationConfirmOpen} 
        onClose={() => setSimulationConfirmOpen(false)}
      >
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%,-50%)', 
          width: 400, 
          bgcolor: 'background.paper', 
          border: '1px solid #ccc', 
          boxShadow: 24, 
          p: 4, 
          textAlign: 'center' 
        }}>
          <Typography variant="h6" gutterBottom>
            Confirmation
          </Typography>
          <Typography sx={{ mt: 2, mb: 3 }}>
            Are you sure you want to run the simulation?
          </Typography>
          <Button 
            variant="contained" 
            onClick={handleStartSimulation} 
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
