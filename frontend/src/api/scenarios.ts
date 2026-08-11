import { api } from './client';
import {
  normalizeLoadedScenario,
  toUpdateScenarioBody,
  toUploadScenarioBody,
  type LoadScenarioApiResponse,
} from './scenarioRequest';
import { validateDeletePayload } from './scenarioValidation';
import type {
  LoadAllScenariosResponse,
  ScenarioDetail,
  ScenarioMutationResponse,
  ScenarioPayload,
} from './types/IScenarioTypes';

export const scenariosApi = {
  create: (payload: ScenarioPayload, scenarioIdInput = '') =>
    api
      .post('api/upload_scenario', {
        json: toUploadScenarioBody(payload, scenarioIdInput),
      })
      .json<ScenarioMutationResponse>(),

  listAll: () =>
    api.get('api/load_all_scenarios').json<LoadAllScenariosResponse>(),

  get: async (id: string): Promise<ScenarioDetail> => {
    const res = await api
      .get(`api/load_scenario/${id}`)
      .json<LoadScenarioApiResponse>();
    return normalizeLoadedScenario(res.scenario) as ScenarioDetail;
  },

  update: (payload: Partial<ScenarioPayload> & { scenario_id: string }) =>
    api
      .post('api/update_scenario', { json: toUpdateScenarioBody(payload) })
      .json<ScenarioMutationResponse>(),

  remove: (scenarioId: string) => {
    const validation = validateDeletePayload(scenarioId);
    if (!validation.ok) {
      throw new Error(validation.message);
    }
    return api
      .post('api/delete_scenario', { json: { scenario_id: scenarioId.trim() } })
      .json<ScenarioMutationResponse>();
  },
};
