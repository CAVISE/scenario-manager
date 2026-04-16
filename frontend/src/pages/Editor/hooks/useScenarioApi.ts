import { useCallback } from 'react';
import {type ScenarioPayload } from '../../../api/types/IScenarioTypes';
import { useEditorStore } from '../../../store/useEditorStore';
import { scenariosApi } from '../../../api/scenarios';

export function useScenarioApi() {
  const updateScenario = useEditorStore(s => s.updateScenario);

  const loadScenario = useCallback(async (id: string) => {
    const data = await scenariosApi.get(id);
    updateScenario({
      id: data.scenario_id ?? '',
      name: data.scenario_name ?? '',
      weather: data.weather ?? '',
    });
    return data;
  }, [updateScenario]);

  const patchScenario = useCallback(async ( payload: Partial<ScenarioPayload>) => {
    const data = await scenariosApi.update(payload);
    updateScenario({
      id: data.scenario_id ?? '',
      name: data.scenario_name ?? '',
      weather: data.weather ?? '',
    });
    return data;
  }, [updateScenario]);

  const putScenario = useCallback(async ( payload: ScenarioPayload) => {
    const data = await scenariosApi.replace(payload);
    updateScenario({
      id: data.scenario_id ?? '',
      name: data.scenario_name ?? '',
      weather: data.weather ?? '',
    });
    return data;
  }, [updateScenario]);

  return {
    loadScenario,
    patchScenario,
    putScenario,
  };
}

