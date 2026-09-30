import type { ScenarioPayload } from '@/api/types/IScenarioTypes';

export interface ScenarioCreateVariables {
  payload: ScenarioPayload;
  scenarioIdInput?: string;
}

export interface ScenarioPatchVariables {
  id: string;
  payload: Partial<ScenarioPayload> & {
    weather?: string;
    file_?: string | null;
  };
}

export interface ScenarioDeleteVariables {
  id: string;
  payload: ScenarioPayload;
}
