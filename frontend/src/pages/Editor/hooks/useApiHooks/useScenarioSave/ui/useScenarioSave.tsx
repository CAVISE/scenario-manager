import { useScenarioCreateMutation } from '../../useScenarioQueries';
import { getApiErrorMessage } from '../../../../../../api/errors';
import { buildScenarioPayload } from '../../../../../components/RightPanel/components/ScenarioControlWidget/Handlers';

export function useScenarioSave() {
  const createScenarioMutation = useScenarioCreateMutation();
  return async () => {
    try {
      await createScenarioMutation.mutateAsync(buildScenarioPayload());
    } catch (err) {
      console.error(err);
      alert(await getApiErrorMessage(err, 'Failed to save scenario.'));
    }
  };
}
