import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { scenariosApi } from '../../../../../../api/scenarios';
import { useEditorStore } from '../../../../../../store';
import { ScenarioPayload } from '../../../../../../api/types/IScenarioTypes';

export const scenarioKeys = {
  all: ['scenarios'] as const,
  detail: (id: string) => ['scenarios', id] as const,
  list: () => ['scenarios', 'list'] as const,
};

export function useScenariosListQuery(enabled: boolean) {
  return useQuery({
    queryKey: scenarioKeys.list(),
    queryFn: async () => {
      const res = await scenariosApi.listAll();
      return res.scenarios;
    },
    enabled,
  });
}

export function useScenarioDetailQuery(id: string | null) {
  const updateScenario = useEditorStore((s) => s.updateScenario);

  return useQuery({
    queryKey: id ? scenarioKeys.detail(id) : scenarioKeys.all,
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error('scenario id is required');
      const data = await scenariosApi.get(id);
      updateScenario({
        id: data.scenario_id ?? '',
        name: data.scenario_name ?? '',
        weather: data.weather ?? '',
      });
      return data;
    },
  });
}

export function useScenarioCreateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ScenarioPayload) => scenariosApi.create(payload),
    onSuccess: (data) => {
      if (data.scenario_id) {
        queryClient.setQueryData(scenarioKeys.detail(data.scenario_id), data);
      }
    },
  });
}

export function useScenarioPatchMutation() {
  const queryClient = useQueryClient();
  const updateScenario = useEditorStore((s) => s.updateScenario);

  return useMutation({
    mutationFn: ({
      payload,
    }: {
      id: string;
      payload: Partial<ScenarioPayload>;
    }) => scenariosApi.update(payload),
    onSuccess: (data) => {
      if (data.scenario_id) {
        queryClient.setQueryData(scenarioKeys.detail(data.scenario_id), data);
      }
      updateScenario({
        id: data.scenario_id ?? '',
        name: data.scenario_name ?? '',
        weather: data.weather ?? '',
      });
    },
  });
}

export function useScenarioPutMutation() {
  const queryClient = useQueryClient();
  const updateScenario = useEditorStore((s) => s.updateScenario);

  return useMutation({
    mutationFn: ({ payload }: { id: string; payload: ScenarioPayload }) =>
      scenariosApi.replace(payload),
    onSuccess: (data) => {
      if (data.scenario_id) {
        queryClient.setQueryData(scenarioKeys.detail(data.scenario_id), data);
      }
      updateScenario({
        id: data.scenario_id ?? '',
        name: data.scenario_name ?? '',
        weather: data.weather ?? '',
      });
    },
  });
}
