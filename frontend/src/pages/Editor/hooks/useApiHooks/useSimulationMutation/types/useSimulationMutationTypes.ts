import { ScenarioGroup } from '../../../../../../api/types/IScenarioTypes';
import { OpenCDAAttackConfig } from '../../../../Generators/types/configGeneratorsTypes';

export interface StartSimulationPayload {
  scenario_id: string;
  scenario_name: string;
  weather: string;
  scenario: ScenarioGroup[];
  description: string;
  opencda_config_yaml: string;
  map: string;
  xodr?: string | undefined;
  max_ticks?: number;
  map_offsets?: { x: number; y: number };
<<<<<<< HEAD
=======
  attacks?: OpenCDAAttackConfig[];
>>>>>>> c8ef1d03840f60d256ebb625220cd565f0cd09ad
}
