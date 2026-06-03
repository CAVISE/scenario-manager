import { useCallback } from 'react';
import { type ScenarioPayload } from '../../../../../../api/types/IScenarioTypes';
import { useEditorStore } from '../../../../../../store';
import { scenariosApi } from '../../../../../../api/scenarios';

export function useScenarioApi() {
  const updateScenario = useEditorStore((s) => s.updateScenario);

  const loadScenario = useCallback(
    async (id: string) => {
      const data = await scenariosApi.get(id);
      if (data.file_) {
        localStorage.setItem('cached_xodr', data.file_);
      }
      updateScenario({
        id: data.scenario_id ?? '',
        name: data.name_of_scenario ?? '',
        weather: data.weather ?? '',
        file_: data.file_ ?? null,
      });
      return data;
    },
    [updateScenario],
  );

  const patchScenario = useCallback(
    async (payload: Partial<ScenarioPayload> & { scenario_id: string }) => {
      const data = await scenariosApi.update(payload);
      if (data.scenario_id) {
        updateScenario({ id: data.scenario_id });
      }
      return data;
    },
    [updateScenario],
  );

  const putScenario = useCallback(
    async (payload: ScenarioPayload) => {
      const data = await scenariosApi.replace(payload);
      if (data.scenario_id) {
        updateScenario({ id: data.scenario_id });
      }
      return data;
    },
    [updateScenario],
  );

  return {
    loadScenario,
    patchScenario,
    putScenario,
  };
}
