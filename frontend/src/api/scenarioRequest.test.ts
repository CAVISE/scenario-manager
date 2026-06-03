import { describe, expect, it } from 'vitest';
import {
  scenarioGroupsFromPayload,
  toUploadScenarioBody,
} from './scenarioRequest';
import type { ScenarioPayload } from './types/IScenarioTypes';

describe('toUploadScenarioBody', () => {
  it('wraps scenario groups for upload', () => {
    const payload: ScenarioPayload = {
      scenario_id: 'sc-1',
      name_of_scenario: 'My scenario',
      description: 'note',
      preview: null,
      file_: null,
      scenario: [
        {
          vehicle: 'car',
          path: [{ x: 0, y: 0, z: 0 }],
        },
      ],
    };

    expect(toUploadScenarioBody(payload)).toEqual({
      scenario_id: 'sc-1',
      name_of_scenario: 'My scenario',
      description: 'note',
      preview: undefined,
      file_: undefined,
      scenario: {
        scenario_text: [{ vehicle: 'car', path: [{ x: 0, y: 0, z: 0 }] }],
      },
    });
  });

  it('throws when name is missing', () => {
    const payload: ScenarioPayload = {
      scenario_id: 'sc-1',
      name_of_scenario: null,
      description: null,
      preview: null,
      file_: null,
      scenario: [],
    };
    expect(() => toUploadScenarioBody(payload)).toThrow(/name/i);
  });

  it('reads groups from stored json shape', () => {
    const groups = scenarioGroupsFromPayload({
      scenario_text: [{ vehicle: 'RSU', path: [{ x: 1, y: 2, z: 3 }] }],
    });
    expect(groups).toHaveLength(1);
    expect(groups[0]?.vehicle).toBe('RSU');
  });
});
