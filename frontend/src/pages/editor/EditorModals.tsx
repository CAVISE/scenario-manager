import { useState, useCallback, useEffect } from 'react';
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
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import TelemetryModal from '../../shared/ui/TelemetryModal';
import { useStartSimulationMutation } from './hooks/useSimulationMutation';
import { useEditorStore } from '../../store';
import { getApiErrorMessage } from '../../api/errors';
import type { StartSimulationPayload } from './hooks/useSimulationMutation.types';
import { buildScenarioPayload } from './right-panel/ScenarioControlWidget/handlers';
import { validateStartSimulationPayload } from '../../api/scenarioValidation';
import {
  fetchXodrText,
  getStoredXodrName,
  resolveXodrTextForSimulation,
  setStoredXodrName,
} from '../../shared/lib/xodrRepository';
import { CARLA_MAPS } from './sim-config-modal/SimConfigModal.types';
import { useEditorRefs, useHooks } from './context';
import { ScenarioGroup } from '../../api/scenario.types';
import { buildOpenCDAArtifact } from './generators/configGenerators';
import { clearLoadedSumoNetwork } from './generators/exporters/sumoNetwork';
import {
  confirmModalStyles,
  confirmIconWrapStyles,
  ACCENT,
  confirmTitleStyles,
  confirmBodyStyles,
  inlineAlertStyles,
  confirmActionsStyles,
  cancelButtonStyles,
  runButtonStyles,
  mapPickerModalStyles,
  mapPickerHeaderStyles,
  mapPickerTitleStyles,
  mapListStyles,
  mapListItemStyles,
  mapItemPrimaryStyles,
  mapItemSecondaryStyles,
} from './EditorModals.types';

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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.editorModals = {
      openTelemetry: () => setTelemetryModalOpen(true),
      openSimulation: () => setSimulationConfirmOpen(true),
      openMapPicker: () => setMapPickerOpen(true),
    };

    return () => {
      delete (window as Window).editorModals;
    };
  }, []);
  const handleSelectMap = useCallback(
    async (mapName: string) => {
      setMapPickerError(null);
      setLoadingMap(mapName);
      try {
        const xodrName = setStoredXodrName(mapName);
        const xodrText = await fetchXodrText(xodrName);
        updateSimConfigCarla({ map: mapName });
        clearLoadedSumoNetwork();
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

  const handleStart = useCallback(async () => {
    setSimulationError(null);

    const state = useEditorStore.getState();
    const scenario = state.Scenario;
    const mapName = getStoredXodrName(state.simConfig?.carla?.map);
    const xodr = await resolveXodrTextForSimulation(mapName);

    const payload: StartSimulationPayload = {
      scenario_id: scenario.id || '',
      scenario_name: scenario.name || 'Scenario',
      weather: scenario.weather || 'ClearNoon',
      description: scenario.description || '',
      opencda_config_yaml: buildOpenCDAArtifact(state),
      map: mapName,
      xodr,
      scenario: buildScenarioPayload().scenario as ScenarioGroup[],
      attacks: state.simConfig?.attacks ?? [],
      map_offsets: odrMapRef.current
        ? { x: odrMapRef.current.x_offs, y: -odrMapRef.current.y_offs }
        : undefined,
    };

    const validation = validateStartSimulationPayload(payload);
    if (!validation.ok) {
      setSimulationError(validation.message);
      return;
    }

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
  }, [startSimulationMutation, odrMapRef]);

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
        <Box sx={confirmModalStyles}>
          <Box sx={confirmIconWrapStyles}>
            <CheckCircleOutlineIcon sx={{ fontSize: 32, color: ACCENT }} />
          </Box>
          <Typography variant="h6" sx={confirmTitleStyles}>
            Run simulation?
          </Typography>
          <Typography sx={confirmBodyStyles}>
            This will start a new CARLA simulation run with the current scenario
            configuration.
          </Typography>
          {simulationError && (
            <Alert severity="error" sx={inlineAlertStyles}>
              {simulationError}
            </Alert>
          )}
          <Box sx={confirmActionsStyles}>
            <Button
              variant="text"
              onClick={() => setSimulationConfirmOpen(false)}
              disabled={startSimulationMutation.isPending}
              sx={cancelButtonStyles}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleStart}
              disabled={startSimulationMutation.isPending}
              sx={runButtonStyles}
            >
              {startSimulationMutation.isPending
                ? 'Starting…'
                : 'Run simulation'}
            </Button>
          </Box>
        </Box>
      </Modal>

      <Modal open={mapPickerOpen} onClose={() => setMapPickerOpen(false)}>
        <Box sx={mapPickerModalStyles}>
          <Box sx={mapPickerHeaderStyles}>
            <MapOutlinedIcon sx={{ fontSize: 20, color: ACCENT }} />
            <Typography variant="h6" sx={mapPickerTitleStyles}>
              Select map
            </Typography>
          </Box>
          {mapPickerError ? (
            <Alert severity="error" sx={inlineAlertStyles}>
              {mapPickerError}
            </Alert>
          ) : null}
          <List dense sx={mapListStyles}>
            {CARLA_MAPS.map((mapName) => (
              <ListItemButton
                key={mapName}
                onClick={() => handleSelectMap(mapName)}
                disabled={Boolean(loadingMap)}
                sx={mapListItemStyles}
              >
                <ListItemText
                  primary={mapName}
                  secondary={loadingMap === mapName ? 'Loading…' : undefined}
                  primaryTypographyProps={{ sx: mapItemPrimaryStyles }}
                  secondaryTypographyProps={{ sx: mapItemSecondaryStyles }}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Modal>
    </>
  );
}
