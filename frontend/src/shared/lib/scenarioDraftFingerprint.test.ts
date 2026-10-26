import { describe, expect, it } from 'vitest';

import {
  getScenarioDraftFingerprint,
  hasUnsavedScenarioChanges,
} from './scenarioDraftFingerprint';

const createState = (): Parameters<typeof hasUnsavedScenarioChanges>[0] => ({
  Scenario: { id: 'scenario-1', name: 'Town drive', weather: 'ClearNoon' },
  simConfig: { carla: { map: 'Town01' } },
  cars: [],
  RSUs: [],
  lidars: [],
  points: [],
  buildings: [],
  pedestrians: [],
  savedScenarioFingerprint: null,
});

describe('hasUnsavedScenarioChanges', () => {
  it('does not flag a state matching the saved fingerprint', () => {
    const state = createState();
    state.savedScenarioFingerprint = getScenarioDraftFingerprint(state);

    expect(hasUnsavedScenarioChanges(state)).toBe(false);
  });

  it('flags a changed scenario, map, or scene object', () => {
    const state = createState();
    state.savedScenarioFingerprint = getScenarioDraftFingerprint(state);

    state.Scenario.name = 'Changed title';
    expect(hasUnsavedScenarioChanges(state)).toBe(true);

    state.Scenario.name = 'Town drive';
    state.cars.push({ id: 'car-1' });
    expect(hasUnsavedScenarioChanges(state)).toBe(true);
  });

  it('treats a legacy draft without a fingerprint as changed when it has data', () => {
    expect(hasUnsavedScenarioChanges(createState())).toBe(true);
  });
});
