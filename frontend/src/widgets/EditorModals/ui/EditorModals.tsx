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
import { CheckCircleOutline as CheckCircleOutlineIcon } from '@mui/icons-material';
import { MapOutlined as MapOutlinedIcon } from '@mui/icons-material';

import {
  CARLA_MAPS,
  fetchXodrText,
  getStoredXodrName,
  resolveXodrTextForSimulation,
  setStoredXodrName,
} from '@editor/hooks/useThreeScene/hooks/useOdrLoader/utils/xodrRepository';
import { useEditorRefs, useHooks } from '@editor/context';

import { getApiErrorMessage } from '@/api/errors';
import { validateStartSimulationPayload } from '@/api/scenarioValidation';
import { ScenarioGroup } from '@/api/types/IScenarioTypes';
import TelemetryModal from '@/shared/ui/TelemetryModal';
import { buildScenarioPayload } from '@right-panel/components/ScenarioControlWidget/Handlers';
import { clearLoadedSumoNetwork } from '@scenario-export';
import { buildOpenCDAArtifact } from '@scenario-export';
import { useStartSimulationMutation } from '@editor/hooks/useApiHooks/useSimulationMutation';
import { StartSimulationPayload } from '@editor/hooks/useApiHooks/useSimulationMutation/types/useSimulationMutationTypes';
import { useEditorStore } from '@/store';
import { useAppToast } from '@/shared/ui/AppToast';
import '../styles/EditorModals.scss';

export default function EditorModals() {
  const [telemetryModalOpen, setTelemetryModalOpen] = useState(false);
  const [simulationConfirmOpen, setSimulationConfirmOpen] = useState(false);
  const [mapPickerOpen, setMapPickerOpen] = useState(
    () => new URLSearchParams(window.location.search).get('mapPicker') === '1'
  );
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [mapPickerError, setMapPickerError] = useState<string | null>(null);
  const [loadingMap, setLoadingMap] = useState<string | null>(null);
  const startSimulationMutation = useStartSimulationMutation();
  const toast = useAppToast();
  const updateSimConfigCarla = useEditorStore((s) => s.updateSimConfigCarla);
  const setSceneExplicitlyCleared = useEditorStore(
    (s) => s.setSceneExplicitlyCleared
  );
  const updateScenario = useEditorStore((s) => s.updateScenario);
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

        updateScenario({ id: '' });

        setSceneExplicitlyCleared(true);
        setMapPickerOpen(false);
        toast.success(`Map ${mapName} loaded.`);
      } catch (err) {
        console.error(err);
        setMapPickerError(
          await getApiErrorMessage(err, `Failed to load map ${mapName}.`)
        );
      } finally {
        setLoadingMap(null);
      }
    },
    [
      loadFile,
      setSceneExplicitlyCleared,
      toast,
      updateSimConfigCarla,
      updateScenario,
    ]
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
          await getApiErrorMessage(err, 'Failed to start simulation.')
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
        <Box className="editor-confirm-modal">
          <Box className="editor-confirm-modal__icon">
            <CheckCircleOutlineIcon />
          </Box>
          <Typography className="editor-confirm-modal__title" variant="h6">
            Run simulation?
          </Typography>
          <Typography className="editor-confirm-modal__body">
            This will start a new CARLA simulation run with the current scenario
            configuration.
          </Typography>
          {simulationError && (
            <Alert className="editor-modal-alert" severity="error">
              {simulationError}
            </Alert>
          )}
          <Box className="editor-confirm-modal__actions">
            <Button
              variant="text"
              onClick={() => setSimulationConfirmOpen(false)}
              disabled={startSimulationMutation.isPending}
              className="editor-modal-button editor-modal-button--cancel"
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleStart}
              disabled={startSimulationMutation.isPending}
              className="editor-modal-button editor-modal-button--run"
            >
              {startSimulationMutation.isPending
                ? 'Starting…'
                : 'Run simulation'}
            </Button>
          </Box>
        </Box>
      </Modal>

      <Modal open={mapPickerOpen} onClose={() => setMapPickerOpen(false)}>
        <Box className="editor-map-picker-modal">
          <Box className="editor-map-picker-modal__header">
            <MapOutlinedIcon />
            <Typography className="editor-map-picker-modal__title" variant="h6">
              Select map
            </Typography>
          </Box>
          {mapPickerError ? (
            <Alert className="editor-modal-alert" severity="error">
              {mapPickerError}
            </Alert>
          ) : null}
          <List className="editor-map-picker-modal__list" dense>
            {CARLA_MAPS.map((mapName) => (
              <ListItemButton
                key={mapName}
                onClick={() => handleSelectMap(mapName)}
                disabled={Boolean(loadingMap)}
                className="editor-map-picker-modal__item"
              >
                <ListItemText
                  primary={mapName}
                  secondary={loadingMap === mapName ? 'Loading…' : undefined}
                  primaryTypographyProps={{
                    className: 'editor-map-picker-modal__item-primary',
                  }}
                  secondaryTypographyProps={{
                    className: 'editor-map-picker-modal__item-secondary',
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Modal>
    </>
  );
}
