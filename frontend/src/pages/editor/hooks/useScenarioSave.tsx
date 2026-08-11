import { useScenarioCreateMutation } from './useScenarioQueries';
import { getApiErrorMessage } from '../../../api/errors';
import { buildScenarioPayload } from '../right-panel/ScenarioControlWidget/handlers';
import { useAppToast } from '../../../shared/ui/AppToast';

export function useScenarioSave() {
  const createScenarioMutation = useScenarioCreateMutation();
  const toast = useAppToast();

  return async () => {
    try {
      const payload = buildScenarioPayload();
      await createScenarioMutation.mutateAsync({ payload });
      toast.success('Scenario saved successfully');
    } catch (err) {
      console.error(err);
      const errorMessage = await getApiErrorMessage(
        err,
        'Failed to save scenario.',
      );
      toast.error(errorMessage);
    }
  };
}
