import { describe, expect, it } from 'vitest';
import {
  validateScenarioId,
  validateUploadPayload,
  validateStartSimulationPayload,
  validateUpdatePayload,
  validateDeletePayload,
} from '../scenarioValidation';
import type {
  ScenarioPayload,
  ScenarioGroup,
  CarScenarioPath,
} from '../types/IScenarioTypes';

const OPENDRIVE = '<?xml version="1.0"?>\n<OpenDRIVE></OpenDRIVE>';

const createCarScenario = (
  overrides?: Partial<ScenarioGroup & { vehicle: 'car' }>,
): ScenarioGroup => ({
  vehicle: 'car',
  path: [
    {
      x: 0,
      y: 0,
      z: 0,
      points: [{ id: 0, x: 1, y: 0, z: 0 }],
    },
  ],
  ...overrides,
});

const basePayload = (): ScenarioPayload => ({
  scenario_id: 'sc-1',
  name_of_scenario: 'Test scenario',
  description: null,
  preview: null,
  file_: OPENDRIVE,
  scenario: [createCarScenario()],
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

  it('rejects a file name instead of OpenDRIVE content', () => {
    const payload = { ...basePayload(), file_: 'Town10HD.xodr' };
    expect(validateUploadPayload(payload).ok).toBe(false);
  });

  it('validates update payload with valid scenario_id', () => {
    const result = validateUpdatePayload('sc-1', {
      name_of_scenario: 'Updated scenario',
    });
    expect(result.ok).toBe(true);
  });

  it('validates delete payload with valid scenario_id', () => {
    const result = validateDeletePayload('sc-1');
    expect(result.ok).toBe(true);
  });

  it('rejects delete payload with invalid scenario_id', () => {
    const result = validateDeletePayload('bad id!');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain('Scenario ID must start with a letter');
    }
  });

  it('rejects delete payload with empty scenario_id', () => {
    const result = validateDeletePayload('');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain('Scenario ID is required');
    }
  });

  it('rejects simulation without cars', () => {
    const result = validateStartSimulationPayload({
      map: 'Town10HD',
      scenario_id: '',
      scenario_name: 'S',
      weather: 'ClearNoon',
      description: '',
      opencda_config_yaml: 'world: {}',
      xodr: OPENDRIVE,
      scenario: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain('Add at least one vehicle');
    }
  });

  it('rejects simulation when car has no route points', () => {
    const result = validateStartSimulationPayload({
      map: 'Town10HD',
      scenario_id: '',
      scenario_name: 'S',
      weather: 'ClearNoon',
      description: '',
      opencda_config_yaml: 'world: {}',
      xodr: OPENDRIVE,
      scenario: [
        {
          vehicle: 'car',
          path: [
            {
              x: 0,
              y: 0,
              z: 0,
              points: [],
            },
          ],
        },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain(
        'Add route points to at least one vehicle',
      );
    }
  });

  it('rejects simulation when car has no points property', () => {
    const result = validateStartSimulationPayload({
      map: 'Town10HD',
      scenario_id: '',
      scenario_name: 'S',
      weather: 'ClearNoon',
      description: '',
      opencda_config_yaml: 'world: {}',
      xodr: OPENDRIVE,
      scenario: [
        {
          vehicle: 'car',
          path: [
            {
              x: 0,
              y: 0,
              z: 0,
            } as CarScenarioPath,
          ],
        },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain(
        'Add route points to at least one vehicle',
      );
    }
  });

  it('accepts simulation with valid scenario_id', () => {
    const result = validateStartSimulationPayload({
      map: 'Town10HD',
      scenario_id: 'valid-id',
      scenario_name: 'S',
      weather: 'ClearNoon',
      description: '',
      opencda_config_yaml: 'world: {}',
      xodr: OPENDRIVE,
      scenario: [createCarScenario()],
    });
    expect(result.ok).toBe(true);
  });

  it('rejects simulation with invalid scenario_id', () => {
    const result = validateStartSimulationPayload({
      map: 'Town10HD',
      scenario_id: 'bad id!',
      scenario_name: 'S',
      weather: 'ClearNoon',
      description: '',
      opencda_config_yaml: 'world: {}',
      xodr: OPENDRIVE,
      scenario: [createCarScenario()],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain('Scenario ID must start with a letter');
    }
  });

  it('rejects simulation without loaded OpenDRIVE content', () => {
    const result = validateStartSimulationPayload({
      map: 'Town10HD',
      scenario_id: '',
      scenario_name: 'S',
      weather: 'ClearNoon',
      description: '',
      opencda_config_yaml: 'world: {}',
      xodr: undefined,
      scenario: [createCarScenario()],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain('OpenDRIVE map failed to load');
    }
  });

  it('validates scenario id when required', () => {
    const result = validateScenarioId('', { required: true });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain('Scenario ID is required');
    }
  });

  it('validates scenario id when not required and empty', () => {
    const result = validateScenarioId('', { required: false });
    expect(result.ok).toBe(true);
  });

  it('covers line 96: rejects unknown vehicle type in scenario group', () => {
    const payload = {
      ...basePayload(),
      scenario: [
        {
          vehicle: 'airplane' as 'car',
          path: [
            {
              x: 0,
              y: 0,
              z: 0,
              points: [{ id: 0, x: 1, y: 0, z: 0 }],
            },
          ],
        },
      ] as ScenarioGroup[],
    };
    const result = validateUploadPayload(payload);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain('Unknown vehicle type');
      expect(result.message).toContain('airplane');
    }
  });

  it('covers line 96: rejects unknown vehicle type in update payload', () => {
    const result = validateUpdatePayload('sc-1', {
      scenario: [
        {
          vehicle: 'boat' as 'car',
          path: [
            {
              x: 0,
              y: 0,
              z: 0,
              points: [{ id: 0, x: 1, y: 0, z: 0 }],
            },
          ],
        },
      ] as ScenarioGroup[],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain('Unknown vehicle type');
      expect(result.message).toContain('boat');
    }
  });

  it('covers line 106: rejects invalid coordinate (string instead of number)', () => {
    const payload = {
      ...basePayload(),
      scenario: [
        {
          vehicle: 'car',
          path: [
            {
              x: 'invalid' as unknown as number,
              y: 0,
              z: 0,
              points: [{ id: 0, x: 1, y: 0, z: 0 }],
            } as CarScenarioPath,
          ],
        },
      ],
    };
    const result = validateUploadPayload(payload as ScenarioPayload);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain('coordinate "x" must be a number');
      expect(result.message).toContain('Group 1, item 1');
    }
  });

  it('covers line 106: rejects invalid coordinate (null instead of number)', () => {
    const payload = {
      ...basePayload(),
      scenario: [
        {
          vehicle: 'car',
          path: [
            {
              x: 0,
              y: null as unknown as number,
              z: 0,
              points: [{ id: 0, x: 1, y: 0, z: 0 }],
            } as CarScenarioPath,
          ],
        },
      ],
    };
    const result = validateUploadPayload(payload as ScenarioPayload);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain('coordinate "y" must be a number');
      expect(result.message).toContain('Group 1, item 1');
    }
  });

  it('covers line 106: rejects invalid coordinate (undefined instead of number)', () => {
    const payload = {
      ...basePayload(),
      scenario: [
        {
          vehicle: 'car',
          path: [
            {
              x: 0,
              y: 0,
              z: undefined as unknown as number,
              points: [{ id: 0, x: 1, y: 0, z: 0 }],
            } as CarScenarioPath,
          ],
        },
      ],
    };
    const result = validateUploadPayload(payload as ScenarioPayload);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain('coordinate "z" must be a number');
      expect(result.message).toContain('Group 1, item 1');
    }
  });

  it('covers line 106: rejects invalid coordinate (Infinity)', () => {
    const payload = {
      ...basePayload(),
      scenario: [
        {
          vehicle: 'car',
          path: [
            {
              x: 0,
              y: Infinity as unknown as number,
              z: 0,
              points: [{ id: 0, x: 1, y: 0, z: 0 }],
            } as CarScenarioPath,
          ],
        },
      ],
    };
    const result = validateUploadPayload(payload as ScenarioPayload);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain('coordinate "y" must be a number');
      expect(result.message).toContain('Group 1, item 1');
    }
  });

  it('covers line 164: rejects simulation when map is empty', () => {
    const result = validateStartSimulationPayload({
      map: '',
      scenario_id: '',
      scenario_name: 'S',
      weather: 'ClearNoon',
      description: '',
      opencda_config_yaml: 'world: {}',
      xodr: OPENDRIVE,
      scenario: [createCarScenario()],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain('Map is required to start simulation');
    }
  });

  it('covers line 167: rejects simulation when map name is too long', () => {
    const longMapName = 'a'.repeat(200);
    const result = validateStartSimulationPayload({
      map: longMapName,
      scenario_id: '',
      scenario_name: 'S',
      weather: 'ClearNoon',
      description: '',
      opencda_config_yaml: 'world: {}',
      xodr: OPENDRIVE,
      scenario: [createCarScenario()],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain('Map name is too long');
    }
  });

  it('covers line 170: rejects simulation when opencda_config_yaml is empty', () => {
    const result = validateStartSimulationPayload({
      map: 'Town10HD',
      scenario_id: '',
      scenario_name: 'S',
      weather: 'ClearNoon',
      description: '',
      opencda_config_yaml: '',
      xodr: OPENDRIVE,
      scenario: [createCarScenario()],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain(
        'OpenCDA YAML is required to start simulation',
      );
    }
  });

  it('validates OpenDRIVE content with correct XML', () => {
    const payload = {
      ...basePayload(),
      file_: '<?xml version="1.0"?>\n<OpenDRIVE version="1.4">\n</OpenDRIVE>',
    };
    const result = validateUploadPayload(payload);
    expect(result.ok).toBe(true);
  });
});
