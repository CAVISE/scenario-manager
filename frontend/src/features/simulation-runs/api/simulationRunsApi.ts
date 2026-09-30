import { api } from '@/api/client';
import type {
  SimulationRun,
  StopRunResponse,
} from '../types/simulationRunTypes';

export const simulationRunsApi = {
  list: () => api.get('api/v1/runs').json<SimulationRun[]>(),
  cancel: (runId: string) =>
    api
      .post(`api/v1/runs/${encodeURIComponent(runId)}/cancel`)
      .json<StopRunResponse>(),
};
