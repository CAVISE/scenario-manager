import { api } from './client';
import type { StartSimulationPayload } from '@editor/hooks/useApiHooks/useSimulationMutation/types/useSimulationMutationTypes';
import type { ScenarioPreflightResult } from './types/simulationTypes';

export const simulationApi = {
  preflight: (payload: StartSimulationPayload) =>
    api
      .post('api/v1/scenarios/validate', { json: payload })
      .json<ScenarioPreflightResult>(),
};
