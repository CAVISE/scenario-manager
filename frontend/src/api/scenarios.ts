import { api } from './client';
import type { LoadAllScenariosResponse, ScenarioPayload } from './types/IScenarioTypes';

export const scenariosApi = {
  create: (payload: ScenarioPayload) =>
    api.post('api/upload_scenario', { json: payload }).json<ScenarioPayload>(),

  listAll: () => api.get('api/load_all_scenarios').json<LoadAllScenariosResponse>(),

  get: (id: string) =>
    api.get(`api/load_scenario/${id}`).json<ScenarioPayload>(),

  update: ( payload: Partial<ScenarioPayload>) =>
    api.post(`api/update_scenario`, { json: payload }).json<ScenarioPayload>(),

  replace: (payload: ScenarioPayload) =>
    api.post(`api/delete_scenario`, { json: payload }).json<ScenarioPayload>(),
};