import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { simulationRunsApi } from '../api/simulationRunsApi';
import type { SimulationRun } from '../types/simulationRunTypes';

const isInProgress = (run: SimulationRun) =>
  run.status === 'queued' ||
  run.status === 'running' ||
  run.status === 'stopping';

export function useSimulationRuns() {
  const queryClient = useQueryClient();
  const runsQuery = useQuery({
    queryKey: ['simulation-runs'],
    queryFn: simulationRunsApi.list,
    refetchInterval: (query) =>
      query.state.data?.some(isInProgress) ? 3_000 : false,
  });
  const cancelMutation = useMutation({
    mutationFn: simulationRunsApi.cancel,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['simulation-runs'] }),
  });

  return {
    runs: runsQuery.data ?? [],
    error: runsQuery.error,
    isLoading: runsQuery.isLoading,
    isRefreshing: runsQuery.isFetching && !runsQuery.isLoading,
    refresh: () => runsQuery.refetch(),
    cancel: cancelMutation.mutateAsync,
    cancellingRunId: cancelMutation.isPending ? cancelMutation.variables : null,
  };
}
