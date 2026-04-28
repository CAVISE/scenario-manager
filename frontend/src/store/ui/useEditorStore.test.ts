import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from './useEditorStore';

describe('useEditorStore', () => {
  beforeEach(() => {
    useEditorStore.setState(useEditorStore.getInitialState(), true);
  });

  it('removes linked points and lidars when car is deleted', () => {
    const state = useEditorStore.getState();
    const carId = state.addCar(1, 2, 3, 'car', '00ff00');
    state.addPoint(carId, 10, 11, 12);
    state.addLidar(carId, 4, 5, 6);

    expect(useEditorStore.getState().cars).toHaveLength(1);
    expect(useEditorStore.getState().points).toHaveLength(1);
    expect(useEditorStore.getState().lidars).toHaveLength(1);

    useEditorStore.getState().removeCar(carId);

    expect(useEditorStore.getState().cars).toHaveLength(0);
    expect(useEditorStore.getState().points).toHaveLength(0);
    expect(useEditorStore.getState().lidars).toHaveLength(0);
  });

  it('updates scenario fields without dropping existing values', () => {
    const prev = useEditorStore.getState().Scenario;
    useEditorStore.getState().updateScenario({ name: 'Updated name' });
    const next = useEditorStore.getState().Scenario;

    expect(next.name).toBe('Updated name');
    expect(next.id).toBe(prev.id);
    expect(next.weather).toBe(prev.weather);
  });

  it('toggles side panel mode', () => {
    const initial = useEditorStore.getState().isPanelOpen;
    useEditorStore.getState().setChangePanelMode();
    expect(useEditorStore.getState().isPanelOpen).toBe(!initial);
  });

  it('keeps default sim config sections when partial carla update is applied', () => {
    useEditorStore.getState().updateSimConfigCarla({ map: 'town10' });
    const simConfig = useEditorStore.getState().simConfig;

    expect(simConfig.carla.map).toBe('town10');
    expect(simConfig.opencda).toBeDefined();
    expect(simConfig.omnet).toBeDefined();
  });
});
