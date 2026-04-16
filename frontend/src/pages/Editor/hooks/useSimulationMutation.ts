import { useMutation } from '@tanstack/react-query';
import { api } from '../../../api/client';
import { StartSimulationPayload } from './types/useSimulationMutationTypes';

export function useStartSimulationMutation() {
  return useMutation({
    mutationFn: (payload: StartSimulationPayload) =>
      api.post('api/start_opencda', { json: payload }),
  });
}

