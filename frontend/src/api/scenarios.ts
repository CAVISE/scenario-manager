import { api } from './client';
import {
  normalizeLoadedScenario,
  toUpdateScenarioBody,
  toUploadScenarioBody,
} from './scenarioRequest';
import { validateDeletePayload } from './scenarioValidation';
import type {
  ScenarioApiDetail,
  ScenarioDetail,
  ScenarioMutationResponse,
  ScenarioPageResponse,
  ScenarioPayload,
} from './types/IScenarioTypes';

export const scenariosApi = {
  create: (payload: ScenarioPayload, scenarioIdInput = '') =>
    api
      .post('api/v1/scenarios', {
        json: toUploadScenarioBody(payload, scenarioIdInput),
      })
      .json<ScenarioMutationResponse>(),

  listAll: () =>
    api.get('api/v1/scenarios?offset=0&limit=100').json<ScenarioPageResponse>(),

  get: async (id: string): Promise<ScenarioDetail> => {
    const scenario = await api
      .get(`api/v1/scenarios/${id}`)
      .json<ScenarioApiDetail>();
    return normalizeLoadedScenario(scenario) as ScenarioDetail;
  },

  update: (payload: Partial<ScenarioPayload> & { scenario_id: string }) =>
    api
      .patch(`api/v1/scenarios/${payload.scenario_id}`, {
        json: toUpdateScenarioBody(payload),
      })
      .json<ScenarioMutationResponse>(),

  remove: (scenarioId: string) => {
    const validation = validateDeletePayload(scenarioId);
    if (!validation.ok) {
      throw new Error(validation.message);
    }
    return api
      .delete(`api/v1/scenarios/${scenarioId.trim()}`)
      .json<ScenarioMutationResponse>();
  },
};
