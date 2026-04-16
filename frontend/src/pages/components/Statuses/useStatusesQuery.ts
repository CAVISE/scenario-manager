import {useQuery} from '@tanstack/react-query';
import { Status, statusesKey } from './types/IStatusesTypes';


export function useStatusesQuery() {
  return useQuery({
    queryKey: statusesKey,
    queryFn: async (): Promise<Status[]> => {
      return [];
    },
    staleTime: 10_000,
  });
}

