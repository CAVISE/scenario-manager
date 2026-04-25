import { ScenarioGroup } from '../../../../../../api/types/IScenarioTypes';

export interface StartSimulationPayload {
  scenario_id: string;
  scenario_name: string;
  weather: string;
  scenario: ScenarioGroup[];
  description: string;
}
