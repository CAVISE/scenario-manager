import { useRef, useState } from 'react';
import { getApiErrorMessage } from '@/api/errors';
import { useNoticeWithToast } from '@/components/AppToast';
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
  handleDelete,
  handlePatch,
  handleRunSimulation,
} from '../Handlers';

type Operation = 'save' | 'delete' | 'run';

export function useScenarioControls() {
  const { odrMapRef } = useEditorRefs();
  const createMutation = useScenarioCreateMutation();
  const patchMutation = useScenarioPatchMutation();
  const deleteMutation = useScenarioDeleteMutation();
  const startMutation = useStartSimulationMutation();
  const [operation, setOperation] = useState<Operation | null>(null);
  const operationRef = useRef<Operation | null>(null);
  const [notice, setNotice] = useState('');
  const notify = useNoticeWithToast(setNotice);

  const saveCurrent = () => {
    const id = useEditorStore.getState().Scenario.id.trim();
    return id
      ? handlePatch(notify, id, true, patchMutation)
      : handleCreate(notify, createMutation);
  };

  const execute = async (next: Operation) => {
    if (
      operationRef.current ||
      startMutation.isPending ||
      useEditorStore.getState().simulationSession.phase === 'running'
    )
      return;

    operationRef.current = next;
    setOperation(next);
    setNotice('');
    try {
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
    save: () => execute('save'),
    remove: () => execute('delete'),
    run: () => execute('run'),
  };
}

export type ScenarioControls = ReturnType<typeof useScenarioControls>;
