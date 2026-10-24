import { validateStartSimulationPayload } from '@/api/scenarioValidation';
import { getApiErrorMessage } from '@/api/errors';
import { buildOpenCDAArtifact } from '@scenario-export';
import { useStartSimulationMutation } from '@editor/hooks/useApiHooks/useSimulationMutation';
import type { StartSimulationPayload } from '@editor/hooks/useApiHooks/useSimulationMutation/types/useSimulationMutationTypes';
import { resolveXodrTextForSimulation } from '@editor/hooks/useThreeScene/hooks/useOdrLoader/utils/xodrRepository';
import { useEditorStore } from '@/store';
import type { ScenarioGroup as ApiScenarioGroup } from '@/api/types/IScenarioTypes';

import { buildScenarioPayload } from './scenario.load.handler';

export const buildStartSimulationPayload = async (
  scenarioIdInput: string,
  mapOffsets?: { x: number; y: number }
): Promise<StartSimulationPayload> => {
  const state = useEditorStore.getState();
  const scenario = state.Scenario;
  const map = state.simConfig?.carla?.map || 'Town10HD';
  const xodr = await resolveXodrTextForSimulation(map);
  return {
    scenario_id: scenario.id || scenarioIdInput.trim() || '',
    scenario_name: scenario.name || 'Scenario',
    scenario: buildScenarioPayload().scenario as ApiScenarioGroup[],
    description: scenario.description || '',
    opencda_config_yaml: buildOpenCDAArtifact(state),
    map,
    xodr,
    max_ticks: useEditorStore.getState().simConfig?.max_ticks ?? 2000,
    map_offsets: mapOffsets,
    attacks: useEditorStore.getState().simConfig?.attacks ?? [],
  };
};

export const handleRunSimulation = async (
  setNotice: (value: string) => void,
  scenarioIdInput: string,
  startMutation: ReturnType<typeof useStartSimulationMutation>,
  mapOffsets?: { x: number; y: number }
) => {
  const payload = await buildStartSimulationPayload(
    scenarioIdInput,
    mapOffsets
  );
  const validation = validateStartSimulationPayload(payload);
  if (!validation.ok) {
    setNotice(validation.message);
    return;
  }

  const updateSession = useEditorStore.getState().updateSimulationSession;
  const alreadyRunning =
    useEditorStore.getState().simulationSession.phase === 'running';
  if (!alreadyRunning && typeof updateSession === 'function') {
    updateSession({
      phase: 'running',
      runId: null,
      status: 'running',
      error: null,
      startedAt: Date.now(),
      tick: 0,
      maxTicks: 0,
      partial: false,
    });
  }

  startMutation.mutate(payload, {
    onSuccess: (response) => {
      if (
        response?.status !== 'queued' &&
        typeof updateSession === 'function'
      ) {
        updateSession({
          runId: response?.run_id ?? null,
          status: response?.status ?? 'running',
        });
      }
      setNotice(
        response?.status === 'queued'
          ? 'The simulation is queued and will start after the active run.'
          : 'The simulation has started.'
      );
    },
    onError: async (err) => {
      console.error(err);
      const message = await getApiErrorMessage(
        err,
        'Failed to start simulation.'
      );
      if (typeof updateSession === 'function') {
        updateSession({ phase: 'error', status: 'error', error: message });
      }
      setNotice(message);
    },
  });
};
