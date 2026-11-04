type ScenarioDraftState = {
  Scenario: {
    id?: string;
    name?: string;
    weather?: string;
    description?: string;
  };
  simConfig: { carla: { map?: string } };
  cars: unknown[];
  RSUs: unknown[];
  lidars: unknown[];
  points: unknown[];
  buildings: unknown[];
  pedestrians: unknown[];
  savedScenarioFingerprint: string | null;
};

export function getScenarioDraftFingerprint(state: ScenarioDraftState): string {
  return JSON.stringify({
    scenario: {
      name: state.Scenario.name ?? '',
      weather: state.Scenario.weather ?? '',
      description: state.Scenario.description ?? '',
    },
    map: state.simConfig.carla.map ?? '',
    cars: state.cars,
    rsus: state.RSUs,
    lidars: state.lidars,
    points: state.points,
    buildings: state.buildings,
    pedestrians: state.pedestrians,
  });
}

export function hasUnsavedScenarioChanges(state: ScenarioDraftState): boolean {
  if (state.savedScenarioFingerprint) {
    return (
      state.savedScenarioFingerprint !== getScenarioDraftFingerprint(state)
    );
  }

  return Boolean(
    state.Scenario.id ||
    state.cars.length ||
    state.RSUs.length ||
    state.lidars.length ||
    state.points.length ||
    state.buildings.length ||
    state.pedestrians.length
  );
}
