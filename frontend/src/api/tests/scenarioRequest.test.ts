import { describe, expect, it } from 'vitest';
import {
  scenarioGroupsFromPayload,
  toUpdateScenarioBody,
  toUploadScenarioBody,
  normalizeLoadedScenario,
} from '../scenarioRequest';
import {
  ScenarioPayload,
  LoadScenarioApiResponse,
} from '../types/IScenarioTypes';

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

  it('prefers the explicit scenarioIdInput argument over payload.scenario_id', () => {
    const payload: ScenarioPayload = {
      scenario_id: 'payload-id',
      name_of_scenario: 'Scenario',
      description: null,
      preview: null,
      file_: null,
      scenario: [],
    };

    const body = toUploadScenarioBody(payload, 'explicit-id');

    expect(body.scenario_id).toBe('explicit-id');
  });

  it('falls back to payload.scenario_id when scenarioIdInput is not given', () => {
    const payload: ScenarioPayload = {
      scenario_id: 'payload-id',
      name_of_scenario: 'Scenario',
      description: null,
      preview: null,
      file_: null,
      scenario: [],
    };

    const body = toUploadScenarioBody(payload);

    expect(body.scenario_id).toBe('payload-id');
  });

  it('leaves scenario_id undefined when neither scenarioIdInput nor payload.scenario_id is given', () => {
    const payload: ScenarioPayload = {
      scenario_id: null,
      name_of_scenario: 'Scenario',
      description: null,
      preview: null,
      file_: null,
      scenario: [],
    };

    const body = toUploadScenarioBody(payload);

    expect(body.scenario_id).toBeUndefined();
  });

  it('reads groups from stored json shape', () => {
    const groups = scenarioGroupsFromPayload({
      scenario_text: [{ vehicle: 'RSU', path: [{ x: 1, y: 2, z: 3 }] }],
    });
    expect(groups).toHaveLength(1);
    expect(groups[0]?.vehicle).toBe('RSU');
  });
});

describe('toUpdateScenarioBody', () => {
  it('includes OpenDRIVE content and allows clearing scenario groups', () => {
    const file = '<OpenDRIVE></OpenDRIVE>';
    expect(
      toUpdateScenarioBody({
        scenario_id: 'sc-1',
        file_: file,
        scenario: [],
      }),
    ).toEqual({
      scenario_id: 'sc-1',
      scenario_name: undefined,
      annotation: undefined,
      preview: undefined,
      file_: file,
      scenario: { scenario_text: [] },
    });
  });

  it('throws with the validation message when scenario_id is empty', () => {
    expect(() =>
      toUpdateScenarioBody({ scenario_id: '', file_: null, scenario: [] }),
    ).toThrow('Scenario ID is required.');
  });

  it('omits the scenario key entirely when payload.scenario is not given (leaves existing groups untouched)', () => {
    const body = toUpdateScenarioBody({ scenario_id: 'sc-1' });

    expect('scenario' in body).toBe(false);
    expect(body).toEqual({
      scenario_id: 'sc-1',
      scenario_name: undefined,
      description: undefined,
      preview: undefined,
      file_: undefined,
    });
  });

  it('passes through name_of_scenario, description, and preview when given', () => {
    const body = toUpdateScenarioBody({
      scenario_id: 'sc-1',
      name_of_scenario: 'Renamed',
      description: 'note',
      preview: 'data:image/png;base64,AAA',
    });

    expect(body.scenario_name).toBe('Renamed');
    expect(body.description).toBe('note');
    expect(body.preview).toBe('data:image/png;base64,AAA');
  });
});

describe('scenarioGroupsFromPayload', () => {
  it('returns an empty array for undefined input', () => {
    expect(scenarioGroupsFromPayload(undefined)).toEqual([]);
  });

  it('returns the array as-is when scenario is already an array', () => {
    const groups = [{ vehicle: 'car' as const, path: [{ x: 0, y: 0, z: 0 }] }];

    expect(scenarioGroupsFromPayload(groups)).toBe(groups);
  });

  it('returns an empty array for an object that has no scenario_text key', () => {
    expect(scenarioGroupsFromPayload({} as never)).toEqual([]);
  });

  it('returns an empty array when scenario_text is present but not an array', () => {
    expect(
      scenarioGroupsFromPayload({ scenario_text: 'not an array' } as never),
    ).toEqual([]);
  });
});

describe('normalizeLoadedScenario', () => {
  const baseRow: LoadScenarioApiResponse['scenario'] = {
    scenario_id: 'sc-1',
    name_of_scenario: 'My Scenario',
  };

  it('reads groups when scenario_text is a flat array', () => {
    const result = normalizeLoadedScenario({
      ...baseRow,
      scenario_text: [{ vehicle: 'car', path: [{ x: 0, y: 0, z: 0 }] }],
    });

    expect(result.scenario).toEqual({
      scenario_text: [{ vehicle: 'car', path: [{ x: 0, y: 0, z: 0 }] }],
    });
  });

  it('reads groups when scenario_text is wrapped in a nested { scenario_text: [...] } object (double-nested legacy shape)', () => {
    const result = normalizeLoadedScenario({
      ...baseRow,
      scenario_text: {
        scenario_text: [{ vehicle: 'RSU', path: [{ x: 1, y: 2, z: 3 }] }],
      },
    });

    expect(result.scenario).toEqual({
      scenario_text: [{ vehicle: 'RSU', path: [{ x: 1, y: 2, z: 3 }] }],
    });
  });

  it('sets scenario to undefined when there are no groups (empty array)', () => {
    const result = normalizeLoadedScenario({
      ...baseRow,
      scenario_text: [],
    });

    expect(result.scenario).toBeUndefined();
  });

  it('sets scenario to undefined when scenario_text is null', () => {
    const result = normalizeLoadedScenario({
      ...baseRow,
      scenario_text: null,
    });

    expect(result.scenario).toBeUndefined();
  });

  it('sets scenario to undefined when scenario_text is missing entirely', () => {
    const result = normalizeLoadedScenario({ ...baseRow });

    expect(result.scenario).toBeUndefined();
  });

  it('sets scenario to undefined when scenario_text is an object without a nested scenario_text array', () => {
    const result = normalizeLoadedScenario({
      ...baseRow,
      scenario_text: { some_other_key: 'value' },
    });

    expect(result.scenario).toBeUndefined();
  });

  it('sets scenario to undefined when the nested scenario_text is present but not an array', () => {
    const result = normalizeLoadedScenario({
      ...baseRow,
      scenario_text: { scenario_text: 'not an array' },
    });

    expect(result.scenario).toBeUndefined();
  });

  it('passes through id, name, description, preview, and file_ with null fallbacks', () => {
    const result = normalizeLoadedScenario({
      scenario_id: 'sc-1',
      name_of_scenario: 'My Scenario',
      description: undefined,
      preview: undefined,
      file_: undefined,
    });

    expect(result.scenario_id).toBe('sc-1');
    expect(result.name_of_scenario).toBe('My Scenario');
    expect(result.description).toBeNull();
    expect(result.preview).toBeNull();
    expect(result.file_).toBeNull();
  });

  it('preserves explicitly given description, preview, and file_ values', () => {
    const result = normalizeLoadedScenario({
      ...baseRow,
      description: 'note',
      preview: 'data:image/png;base64,AAA',
      file_: '<OpenDRIVE></OpenDRIVE>',
    });

    expect(result.description).toBe('note');
    expect(result.preview).toBe('data:image/png;base64,AAA');
    expect(result.file_).toBe('<OpenDRIVE></OpenDRIVE>');
  });
});
