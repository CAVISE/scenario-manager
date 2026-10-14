import { api } from '@/api/client';
import type {
  SimulationRun,
  SimulationRunDetail,
  StopRunResponse,
} from '../types/simulationRunTypes';

export const simulationRunsApi = {
  list: () => api.get('api/v1/runs').json<SimulationRun[]>(),
  detail: (runId: string) =>
    api
      .get(`api/v1/runs/${encodeURIComponent(runId)}/details`)
      .json<SimulationRunDetail>(),
  cancel: (runId: string) =>
    api
      .post(`api/v1/runs/${encodeURIComponent(runId)}/cancel`)
      .json<StopRunResponse>(),
};
