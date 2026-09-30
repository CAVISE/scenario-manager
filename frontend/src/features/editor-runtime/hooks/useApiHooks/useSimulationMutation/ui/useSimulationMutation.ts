import { useMutation } from '@tanstack/react-query';
import { api } from '@/api/client';
import type {
  StartSimulationPayload,
  StartSimulationResponse,
} from '../types/useSimulationMutationTypes';

export function useStartSimulationMutation() {
  return useMutation({
    mutationFn: (payload: StartSimulationPayload) =>
      api
        .post('api/v1/runs', { json: payload })
        .json<StartSimulationResponse>(),
  });
}
