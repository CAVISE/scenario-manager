import {
  validateDeletePayload,
  validateUpdatePayload,
} from '@/api/scenarioValidation';
import { getApiErrorMessage } from '@/api/errors';
import { useEditorStore } from '@/store';
import {
  useScenarioCreateMutation,
  useScenarioDeleteMutation,
  useScenarioPatchMutation,
} from '@editor/hooks/useApiHooks/useScenarioQueries';

import { buildScenarioPayload } from './scenario.load.handler';

export const handleCreate = async (
  setNotice: (value: string) => void,
  createMutation: ReturnType<typeof useScenarioCreateMutation>
): Promise<boolean> => {
  try {
    const payload = buildScenarioPayload();
    const scenarioName = payload.name_of_scenario ?? payload.scenario_name;
    if (!scenarioName || !scenarioName.trim()) {
      setNotice('Scenario name is required.');
      return false;
    }

    const data = await createMutation.mutateAsync({
      payload,
      scenarioIdInput: payload.scenario_id ?? '',
    });
    const resolvedId = data?.scenario_id?.trim() || '';

    if (resolvedId) {
      useEditorStore.getState().updateScenario({
        id: resolvedId,
        revision: data.revision ?? undefined,
      });
    }
    useEditorStore.getState().setSceneExplicitlyCleared(false);
    setNotice('Scenario saved.');
    return true;
  } catch (err) {
    console.error(err);
    setNotice(await getApiErrorMessage(err, 'Failed to save scenario.'));
    return false;
  }
};

export const handlePatch = async (
  setNotice: (value: string) => void,
  scenarioIdInput: string,
  hasId: boolean,
  patchMutation: ReturnType<typeof useScenarioPatchMutation>
): Promise<boolean> => {
  if (!hasId) return false;
  try {
    const id = scenarioIdInput.trim();
    const payload = buildScenarioPayload();
    const validation = validateUpdatePayload(id, payload);
    if (!validation.ok) {
      setNotice(validation.message);
      return false;
    }
    const result = await patchMutation.mutateAsync({ id, payload });
    if (result?.revision) {
      useEditorStore.getState().updateScenario({ revision: result.revision });
    }
    useEditorStore.getState().setSceneExplicitlyCleared(false);
    setNotice(
      result?.warning
        ? `The scenario has been updated. ${result.warning}`
        : 'The scenario has been updated.'
    );
    return true;
  } catch (err) {
    console.error(err);
    setNotice(await getApiErrorMessage(err, 'Failed to update the scenario.'));
    return false;
  }
};

export const handleDelete = async (
  setNotice: (value: string) => void,
  scenarioIdInput: string,
  hasId: boolean,
  deleteMutation: ReturnType<typeof useScenarioDeleteMutation>
) => {
  if (!hasId) return;
  try {
    const id = scenarioIdInput.trim();
    const validation = validateDeletePayload(id);
    if (!validation.ok) {
      setNotice(validation.message);
      return;
    }
    await deleteMutation.mutateAsync({ id, payload: buildScenarioPayload() });
    setNotice('The scenario has been deleted.');
  } catch (err) {
    console.error(err);
    setNotice(await getApiErrorMessage(err, 'Failed to delete scenario.'));
  }
};
