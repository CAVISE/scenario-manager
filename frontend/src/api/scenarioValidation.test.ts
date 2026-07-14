import { describe, expect, it } from 'vitest';
import {
  validateScenarioId,
  validateUploadPayload,
  validateStartSimulationPayload,
} from './scenarioValidation';
import type { ScenarioPayload } from './types/IScenarioTypes';

const basePayload = (): ScenarioPayload => ({
  scenario_id: 'sc-1',
  name_of_scenario: 'Test scenario',
  description: null,
  preview: null,
  file_: 'Town10HD.xodr',
  scenario: [
    {
      vehicle: 'car',
      path: [{ x: 0, y: 0, z: 0, points: [{ id: 0, x: 1, y: 0, z: 0 }] }],
    },
  ],
});

describe('scenarioValidation', () => {
  it('rejects invalid scenario id', () => {
    expect(validateScenarioId('bad id!').ok).toBe(false);
  });

  it('accepts valid upload payload', () => {
    expect(validateUploadPayload(basePayload(), 'sc-1').ok).toBe(true);
  });

  it('rejects upload without name', () => {
    const payload = { ...basePayload(), name_of_scenario: '  ' };
    expect(validateUploadPayload(payload).ok).toBe(false);
  });

  it('rejects simulation without cars', () => {
    const result = validateStartSimulationPayload({
      map: 'Town10HD',
      scenario_id: '',
      scenario_name: 'S',
      weather: 'ClearNoon',
      description: '',
      opencda_config_yaml: 'world: {}',
      scenario: [],
    });
    expect(result.ok).toBe(false);
  });
});
