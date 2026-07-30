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
        name: data.scenario_name ?? data.name_of_scenario ?? '',
        weather: data.weather ?? '',
        description: data.description ?? '',
        file_: data.file_ ?? null,
      });
      return data;
    },
  });
}

export function useScenarioCreateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      scenarioIdInput = '',
    }: {
      payload: ScenarioPayload;
      scenarioIdInput?: string;
    }) => scenariosApi.create(payload, scenarioIdInput),
    onSuccess: (data, variables) => {
      const id =
        variables.scenarioIdInput?.trim() ||
        variables.payload?.scenario_id?.trim() ||
        (data as unknown as { scenario_id?: string })?.scenario_id?.trim();
      if (id) {
        queryClient.setQueryData(scenarioKeys.detail(id), data);
        queryClient.invalidateQueries({ queryKey: scenarioKeys.detail(id) });
        queryClient.invalidateQueries({ queryKey: scenarioKeys.list() });
      }
    },
  });
}

export function useScenarioPatchMutation() {
  const queryClient = useQueryClient();
  const updateScenario = useEditorStore((s) => s.updateScenario);

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<ScenarioPayload> & {
        weather?: string;
        file_?: string | null;
      };
    }) =>
      scenariosApi.update({
        ...payload,
        scenario_id: id,
      }),
    onSuccess: (_data, { id, payload }) => {
      const p = payload as Record<string, unknown>;
      queryClient.invalidateQueries({ queryKey: scenarioKeys.detail(id) });

      const update: Record<string, unknown> = { id };
      const name = p.name_of_scenario ?? p.scenario_name ?? p.name;
      if (name !== undefined) update.name = name;
      if (p.description !== undefined) update.description = p.description;
      if (p.weather !== undefined) update.weather = p.weather;
      if (p.file_ !== undefined) update.file_ = p.file_;

      updateScenario(update as Parameters<typeof updateScenario>[0]);
    },
  });
}

export function useScenarioPutMutation() {
  const queryClient = useQueryClient();
  const updateScenario = useEditorStore((s) => s.updateScenario);
  return useMutation({
    mutationFn: ({ id }: { id: string; payload: ScenarioPayload }) =>
      scenariosApi.replace(id),
    onSuccess: (data, { id }) => {
      const d = data as unknown as {
        scenario_name?: string;
        weather?: string;
        file_?: string | null;
      };
      queryClient.setQueryData(scenarioKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: scenarioKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: scenarioKeys.list() });
      updateScenario({
        id,
        name: d.scenario_name ?? undefined,
        weather: d.weather ?? undefined,
        file_: d.file_ ?? null,
      });
    },
  });
}
