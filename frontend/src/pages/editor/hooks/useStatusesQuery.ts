import { useSimulationSocket } from './useSimulationSocket';
import { Status } from './useStatusesQuery.types';

export function useStatusesQuery() {
  const { state, connected } = useSimulationSocket();

  const data: Status[] = state
    ? [
        {
          scenario_id: state.run_id ?? '—',
          scenario_name: state.map ?? '—',
          status: state.status === 'finished' ? 'true' : 'false',
        },
      ]
    : [];

  return {
    data,
    isLoading: !connected && !state,
    isError: false,
    error: null,
    refetch: () => {},
  };
}
