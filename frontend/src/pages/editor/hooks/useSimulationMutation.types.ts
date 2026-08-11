import { ScenarioGroup } from '../../../api/scenario.types';
import { OpenCDAAttackConfig } from '../generators/generators.types';

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
  attacks?: OpenCDAAttackConfig[];
}
