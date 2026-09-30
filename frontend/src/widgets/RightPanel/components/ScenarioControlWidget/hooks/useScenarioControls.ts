import { useRef, useState } from 'react';
import { getApiErrorMessage } from '@/api/errors';
import { simulationApi } from '@/api/simulation';
import type { ScenarioPreflightResult } from '@/api/types/simulationTypes';
import { useNoticeWithToast } from '@/shared/ui/AppToast';
import { useEditorStore } from '@/store';
import { useEditorRefs } from '@editor/context';
import {
  useScenarioCreateMutation,
  useScenarioDeleteMutation,
  useScenarioPatchMutation,
} from '@editor/hooks/useApiHooks/useScenarioQueries';
import { useStartSimulationMutation } from '@editor/hooks/useApiHooks/useSimulationMutation';
import {
  handleCreate,
  buildStartSimulationPayload,
  handleDelete,
  handlePatch,
  handleRunSimulation,
} from '../Handlers';
import type {
  ScenarioControls,
  ScenarioOperation,
} from '../types/ScenarioControlWidgetTypes';

export function useScenarioControls(): ScenarioControls {
  const { odrMapRef } = useEditorRefs();
  const createMutation = useScenarioCreateMutation();
  const patchMutation = useScenarioPatchMutation();
  const deleteMutation = useScenarioDeleteMutation();
  const startMutation = useStartSimulationMutation();
  const [operation, setOperation] = useState<ScenarioOperation | null>(null);
  const operationRef = useRef<ScenarioOperation | null>(null);
  const [notice, setNotice] = useState('');
  const [preflight, setPreflight] = useState<ScenarioPreflightResult | null>(
    null
  );
  const notify = useNoticeWithToast(setNotice);

  const saveCurrent = () => {
    const id = useEditorStore.getState().Scenario.id.trim();
    return id
      ? handlePatch(notify, id, true, patchMutation)
      : handleCreate(notify, createMutation);
  };

  const execute = async (next: ScenarioOperation) => {
    if (
      operationRef.current ||
      startMutation.isPending ||
      (next !== 'validate' &&
        useEditorStore.getState().simulationSession.phase === 'running')
    )
      return;

    operationRef.current = next;
    setOperation(next);
    setNotice('');
    try {
      if (next === 'validate') {
        const payload = await buildStartSimulationPayload(
          useEditorStore.getState().Scenario.id,
          odrMapRef.current
            ? { x: odrMapRef.current.x_offs, y: -odrMapRef.current.y_offs }
            : undefined
        );
        setPreflight(await simulationApi.preflight(payload));
        return;
      }
      if (next === 'delete') {
        const id = useEditorStore.getState().Scenario.id.trim();
        await handleDelete(notify, id, Boolean(id), deleteMutation);
      } else {
        const saved = await saveCurrent();
        if (next !== 'run' || !saved) return;
        const id = useEditorStore.getState().Scenario.id;
        await handleRunSimulation(
          notify,
          id,
          startMutation,
          odrMapRef.current
            ? { x: odrMapRef.current.x_offs, y: -odrMapRef.current.y_offs }
            : undefined
        );
      }
    } catch (error) {
      notify(
        await getApiErrorMessage(error, `Failed to ${next} scenario.`),
        'error'
      );
    } finally {
      operationRef.current = null;
      setOperation(null);
    }
  };

  return {
    notice,
    operation,
    isBusy: operation !== null || startMutation.isPending,
    preflight,
    save: () => execute('save'),
    remove: () => execute('delete'),
    run: () => execute('run'),
    validate: () => execute('validate'),
  };
}
