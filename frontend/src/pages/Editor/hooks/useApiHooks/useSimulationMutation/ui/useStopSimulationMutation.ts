import { useMutation } from '@tanstack/react-query';
import { api } from '@/api/client';

export function useStopSimulationMutation() {
  return useMutation({
    mutationFn: () => api.post('api/stop'),
  });
}
