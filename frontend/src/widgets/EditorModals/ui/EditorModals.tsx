import { useState, useCallback, useRef } from 'react';
import { Alert, Box, Button, Modal, Typography } from '@mui/material';
import { CheckCircleOutlined as CheckCircleOutlineIcon } from '@mui/icons-material';
import {
  getStoredXodrName,
  getRuntimeXodrName,
  resolveRuntimeXodrTextForSimulation,
} from '@editor/hooks/useThreeScene/hooks/useOdrLoader/utils/xodrRepository';
import { useEditorRefs, useHooks } from '@editor/context';
import { getApiErrorMessage } from '@/api/errors';
import { validateStartSimulationPayload } from '@/api/scenarioValidation';
import { ScenarioGroup } from '@/api/types/IScenarioTypes';
import TelemetryModal from '@/shared/ui/TelemetryModal';
import { buildScenarioPayload } from '@right-panel/components/ScenarioControlWidget/Handlers';
import { buildOpenCDAArtifact } from '@scenario-export';
import { useStartSimulationMutation } from '@editor/hooks/useApiHooks/useSimulationMutation';
import { StartSimulationPayload } from '@editor/hooks/useApiHooks/useSimulationMutation/types/useSimulationMutationTypes';
import { useEditorStore } from '@/store';
import { useAppToast } from '@/shared/ui/AppToast';
import { getOdrMapOffsets } from '@editor/lib/getOdrMapOffsets';
import { odrOffsetsToCarlaOffsets } from '@/shared/lib/coordinateTransform';
import { MapPickerModal } from './MapPickerModal';
import { useMapSelection } from '../hooks/useMapSelection';
import { useEditorModalActions } from '../hooks/useEditorModalActions';
import { useMapChangeConfirmation } from '../hooks/useMapChangeConfirmation';
import { useMapPickerOpenEvent } from '../hooks/useMapPickerOpenEvent';
import { useInitialMapPickerQuery } from '../hooks/useInitialMapPickerQuery';
import { MapChangeConfirmDialog } from './MapChangeConfirmDialog';
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
  useInitialMapPickerQuery();
  const startRequestRef = useRef(0);
  const startSimulationMutation = useStartSimulationMutation();
  const toast = useAppToast();
  const updateSimConfigCarla = useEditorStore((s) => s.updateSimConfigCarla);
  const setSceneExplicitlyCleared = useEditorStore(
    (s) => s.setSceneExplicitlyCleared
  );
  const setMapLoading = useEditorStore((s) => s.setMapLoading);
  const markScenarioClean = useEditorStore((s) => s.markScenarioClean);
  const updateScenario = useEditorStore((s) => s.updateScenario);
  const { loadFile, cancelMapLoad } = useHooks();
  const { odrMapRef } = useEditorRefs();
  const { handleSelectMap, invalidate: invalidateMapSelection } =
    useMapSelection({
      loadFile,
      updateSimConfigCarla,
      updateScenario,
      setSceneExplicitlyCleared,
      setMapLoading,
      markScenarioClean,
      toastSuccess: toast.success,
      setMapPickerOpen,
      setMapPickerError,
      setLoadingMap,
      cancelMapLoad,
    });
  const { pendingMap, requestMapChange, cancelMapChange, discardAndChangeMap } =
    useMapChangeConfirmation({ selectMap: handleSelectMap });
  const openMapPicker = useCallback(() => {
    invalidateMapSelection();
    setLoadingMap(null);
    setMapPickerError(null);
    setMapPickerOpen(true);
  }, [invalidateMapSelection]);
  useMapPickerOpenEvent(openMapPicker);
  useEditorModalActions({
    setTelemetryOpen: setTelemetryModalOpen,
    setSimulationOpen: setSimulationConfirmOpen,
    setMapPickerOpen,
    selectMap: requestMapChange,
  });
  const handleStart = useCallback(async () => {
    if (
      startRequestRef.current ||
      startSimulationMutation.isPending ||
      useEditorStore.getState().isMapLoading
    )
      return;
    const requestId = ++startRequestRef.current;
    setSimulationError(null);
    const state = useEditorStore.getState();
    const scenario = state.Scenario;
    const editorMapName = getStoredXodrName(state.simConfig?.carla?.map);
    const runtimeMapName = getRuntimeXodrName(editorMapName);
    const xodr = await resolveRuntimeXodrTextForSimulation(editorMapName);
    const mapOffsets = getOdrMapOffsets(odrMapRef.current);
    const latestState = useEditorStore.getState();
    if (
      requestId !== startRequestRef.current ||
      latestState.Scenario.id !== scenario.id ||
      getStoredXodrName(latestState.simConfig?.carla?.map) !== editorMapName
    ) {
      if (requestId === startRequestRef.current) startRequestRef.current = 0;
      return;
    }
    const payload: StartSimulationPayload = {
      scenario_id: scenario.id || '',
      scenario_name: scenario.name || 'Scenario',
      weather: scenario.weather || 'ClearNoon',
      description: scenario.description || '',
      opencda_config_yaml: buildOpenCDAArtifact(state),
      map: runtimeMapName,
      xodr,
      scenario: buildScenarioPayload().scenario as ScenarioGroup[],
      attacks: state.simConfig?.attacks ?? [],
      map_offsets: mapOffsets
        ? odrOffsetsToCarlaOffsets(mapOffsets)
        : undefined,
    };
    const validation = validateStartSimulationPayload(payload);
    if (!validation.ok) {
      setSimulationError(validation.message);
      startRequestRef.current = 0;
      return;
    }
    startSimulationMutation.mutate(payload, {
      onSuccess: () => {
        if (requestId !== startRequestRef.current) return;
        setSimulationError(null);
        setSimulationConfirmOpen(false);
      },
      onError: async (err) => {
        console.error(err);
        const message = await getApiErrorMessage(
          err,
          'Failed to start simulation.'
        );
        if (requestId === startRequestRef.current) setSimulationError(message);
      },
      onSettled: () => {
        if (requestId === startRequestRef.current) startRequestRef.current = 0;
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

      <MapPickerModal
        open={mapPickerOpen}
        error={mapPickerError}
        loadingMap={loadingMap}
        onClose={() => setMapPickerOpen(false)}
        onSelectMap={(mapName) => void requestMapChange(mapName)}
      />
      <MapChangeConfirmDialog
        mapName={pendingMap}
        onCancel={cancelMapChange}
        onDiscard={discardAndChangeMap}
      />
    </>
  );
}
