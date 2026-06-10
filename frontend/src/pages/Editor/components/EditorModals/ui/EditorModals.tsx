import { useState, useCallback } from 'react';
import {
  Alert,
  Box,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Modal,
  Typography,
} from '@mui/material';
import TelemetryModal from '../../../../../components/TelemetryModal';
import { useStartSimulationMutation } from '../../../hooks/useApiHooks/useSimulationMutation';
import { useEditorStore } from '../../../../../store';
import { getApiErrorMessage } from '../../../../../api/errors';
import type { StartSimulationPayload } from '../../../hooks/useApiHooks/useSimulationMutation/types/useSimulationMutationTypes';
import { buildScenarioPayload } from '../../../../components/RightPanel/components/ScenarioControlWidget/Handlers';
import {
  fetchXodrText,
  getStoredXodrName,
  setStoredXodrName,
} from '../../../hooks/useThreeScene/hooks/useOdrLoader/utils/xodrRepository';
import { CARLA_MAPS } from '../../SimConfigModal/types/SimConfigModalTypes';
import { useEditorRefs, useHooks } from '../../../context';
import { ScenarioGroup } from '../../../../../api/types/IScenarioTypes';

export default function EditorModals() {
  const [telemetryModalOpen, setTelemetryModalOpen] = useState(false);
  const [simulationConfirmOpen, setSimulationConfirmOpen] = useState(false);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [mapPickerError, setMapPickerError] = useState<string | null>(null);
  const [loadingMap, setLoadingMap] = useState<string | null>(null);
  const startSimulationMutation = useStartSimulationMutation();
  const updateSimConfigCarla = useEditorStore((s) => s.updateSimConfigCarla);
  const { loadFile } = useHooks();
  const { odrMapRef } = useEditorRefs();

  if (typeof window !== 'undefined') {
    window.editorModals = {
      openTelemetry: () => setTelemetryModalOpen(true),
      openSimulation: () => setSimulationConfirmOpen(true),
      openMapPicker: () => setMapPickerOpen(true),
    };
  }

  const handleSelectMap = useCallback(
    async (mapName: string) => {
      setMapPickerError(null);
      setLoadingMap(mapName);
      try {
        const xodrName = setStoredXodrName(mapName);
        const xodrText = await fetchXodrText(xodrName);
        updateSimConfigCarla({ map: mapName });
        loadFile(xodrText, true);
        setMapPickerOpen(false);
      } catch (err) {
        console.error(err);
        setMapPickerError(
          await getApiErrorMessage(err, `Failed to load map ${mapName}.`),
        );
      } finally {
        setLoadingMap(null);
      }
    },
    [loadFile, updateSimConfigCarla],
  );

  const handleStart = useCallback(() => {
    setSimulationError(null);

    const state = useEditorStore.getState();
    const scenario = state.Scenario;
    const mapName = getStoredXodrName(state.simConfig?.carla?.map);

    const payload: StartSimulationPayload = {
      scenario_id: scenario.id || '',
      scenario_name: scenario.name || 'Scenario',
      weather: scenario.weather || 'ClearNoon',
      description: scenario.description || '',
      map: mapName,
      scenario: buildScenarioPayload().scenario as ScenarioGroup[],
      map_offsets: odrMapRef.current
        ? { x: odrMapRef.current.x_offs, y: odrMapRef.current.y_offs }
        : undefined,
    };

    startSimulationMutation.mutate(payload, {
      onSuccess: () => {
        setSimulationError(null);
        setSimulationConfirmOpen(false);
      },
      onError: async (err) => {
        console.error(err);
        setSimulationError(
          await getApiErrorMessage(err, 'Failed to start simulation.'),
        );
      },
    });
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
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 400,
            bgcolor: 'background.paper',
            border: '1px solid #ccc',
            boxShadow: 24,
            p: 4,
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" gutterBottom>
            Confirmation
          </Typography>
          <Typography sx={{ mt: 2, mb: 3 }}>
            Are you sure you want to run the simulation?
          </Typography>
          {simulationError && (
            <Typography sx={{ mb: 2, color: 'error.main' }}>
              {simulationError}
            </Typography>
          )}
          <Button
            variant="contained"
            onClick={handleStart}
            disabled={startSimulationMutation.isPending}
            sx={{
              bgcolor: 'error.main',
              '&:hover': { bgcolor: 'error.dark' },
            }}
          >
            {startSimulationMutation.isPending ? 'Starting...' : 'Run'}
          </Button>
        </Box>
      </Modal>

      <Modal open={mapPickerOpen} onClose={() => setMapPickerOpen(false)}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 420,
            maxHeight: '70vh',
            bgcolor: 'background.paper',
            border: '1px solid #ccc',
            boxShadow: 24,
            p: 3,
            borderRadius: 1,
            overflow: 'auto',
          }}
        >
          <Typography variant="h6" gutterBottom>
            Select map
          </Typography>
          {mapPickerError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {mapPickerError}
            </Alert>
          ) : null}
          <List dense sx={{ p: 0 }}>
            {CARLA_MAPS.map((mapName) => (
              <ListItemButton
                key={mapName}
                onClick={() => handleSelectMap(mapName)}
                disabled={Boolean(loadingMap)}
              >
                <ListItemText
                  primary={mapName}
                  secondary={loadingMap === mapName ? 'Loading…' : undefined}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Modal>
    </>
  );
}
