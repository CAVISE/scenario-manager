import { beforeEach, describe, expect, it } from 'vitest';
import { SimulationConfig, useEditorStore } from './useEditorStore';
import { SelectedObject } from '../pages/editor/editor.types';

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

  it('setBuildingMode(true) enables building mode and clears selectedId', () => {
    const store = useEditorStore.getState();
    const carId = store.addCar(0, 0, 0, 'model', 'red');
    store.selectObject({ id: carId } as unknown as SelectedObject);
    expect(useEditorStore.getState().selectedId).toBe(carId);

    useEditorStore.getState().setBuildingMode(true);

    expect(useEditorStore.getState().isBuildingMode).toBe(true);
    expect(useEditorStore.getState().selectedId).toBeNull();
  });

  it('setBuildingMode(false) disables building mode without clearing selectedId', () => {
    const store = useEditorStore.getState();
    store.setBuildingMode(true);
    const carId = store.addCar(0, 0, 0, 'model', 'red');
    useEditorStore.setState({ selectedId: carId });

    useEditorStore.getState().setBuildingMode(false);

    expect(useEditorStore.getState().isBuildingMode).toBe(false);
    expect(useEditorStore.getState().selectedId).toBe(carId);
  });

  it('setError stores the error value', () => {
    useEditorStore.getState().setError(new Error('something went wrong'));
    expect(useEditorStore.getState().error).toBeInstanceOf(Error);
  });

  it('setError can clear the error', () => {
    useEditorStore.getState().setError(new Error('oops'));
    useEditorStore.getState().setError(null);
    expect(useEditorStore.getState().error).toBeNull();
  });

  it('updateSimConfigOmnet merges omnet fields and preserves others', () => {
    useEditorStore.getState().updateSimConfigOmnet({ port: 9999 } as object);
    const { simConfig } = useEditorStore.getState();

    expect((simConfig.omnet as unknown as { port: number }).port).toBe(9999);
    expect(simConfig.carla).toBeDefined();
    expect(simConfig.sumo).toBeDefined();
  });

  it('updateSimConfigArtery merges artery fields and preserves others', () => {
    useEditorStore.getState().updateSimConfigArtery({ port: 1234 } as object);
    const { simConfig } = useEditorStore.getState();

    expect((simConfig.artery as unknown as { port: number }).port).toBe(1234);
    expect(simConfig.omnet).toBeDefined();
  });

  it('updateSimConfigSionna merges sionna fields and preserves others', () => {
    useEditorStore
      .getState()
      .updateSimConfigSionna({ resolution: 64 } as object);
    const { simConfig } = useEditorStore.getState();

    expect(
      (simConfig.sionna as unknown as { resolution: number }).resolution,
    ).toBe(64);
    expect(simConfig.carla).toBeDefined();
  });

  it('updateSimConfigMPC merges mpc fields and preserves others', () => {
    useEditorStore.getState().updateSimConfigMPC({ enabled: true } as object);
    const { simConfig } = useEditorStore.getState();

    expect((simConfig.mpc as unknown as { enabled: boolean }).enabled).toBe(
      true,
    );
    expect(simConfig.sumo).toBeDefined();
  });

  it('removePedestrian clears selectedId when the removed ped was selected', () => {
    const store = useEditorStore.getState();
    const pedId = store.addPedestrian(1, 2, 3);
    useEditorStore.setState({ selectedId: pedId });

    expect(useEditorStore.getState().selectedId).toBe(pedId);

    useEditorStore.getState().removePedestrian(pedId);

    expect(useEditorStore.getState().pedestrians).toHaveLength(0);
    expect(useEditorStore.getState().selectedId).toBeNull();
  });

  it('removePedestrian keeps selectedId when a different ped is removed', () => {
    const store = useEditorStore.getState();
    const pedId1 = store.addPedestrian(1, 2, 3);
    const pedId2 = store.addPedestrian(4, 5, 6);
    useEditorStore.setState({ selectedId: pedId1 });

    useEditorStore.getState().removePedestrian(pedId2);

    expect(useEditorStore.getState().pedestrians).toHaveLength(1);
    expect(useEditorStore.getState().selectedId).toBe(pedId1);
  });

  it('removeRSU removes by index', () => {
    const store = useEditorStore.getState();
    store.addRSU(0, 0, 0);
    store.addRSU(1, 1, 1);

    expect(useEditorStore.getState().RSUs).toHaveLength(2);

    useEditorStore.getState().removeRSU(0);

    expect(useEditorStore.getState().RSUs).toHaveLength(1);
  });

  it('updateRSU updates fields by id', () => {
    const store = useEditorStore.getState();
    store.addRSU(0, 0, 0);
    const rsuId = useEditorStore.getState().RSUs[0].id;

    useEditorStore.getState().updateRSU(rsuId, { tx_power: 99 });

    expect(useEditorStore.getState().RSUs[0].tx_power).toBe(99);
  });

  it('removeCar clears selectedId when the removed car was selected', () => {
    const store = useEditorStore.getState();
    const carId = store.addCar(0, 0, 0, 'model', 'blue');
    expect(useEditorStore.getState().selectedId).toBe(carId);

    useEditorStore.getState().removeCar(carId);

    expect(useEditorStore.getState().selectedId).toBeNull();
  });

  it('updateSimConfig merges top-level sim config fields', () => {
    useEditorStore
      .getState()
      .updateSimConfig({ sim_duration: 300 } as unknown as SimulationConfig);
    expect(
      (useEditorStore.getState().simConfig as SimulationConfig).sim_duration,
    ).toBe(300);
    expect(useEditorStore.getState().simConfig.carla).toBeDefined();
  });

  it('updatePedestrian updates pedestrian fields by id', () => {
    const store = useEditorStore.getState();
    const pedId = store.addPedestrian(1, 2, 3);

    useEditorStore.getState().updatePedestrian(pedId, { speed: 2.5 });

    const ped = useEditorStore
      .getState()
      .pedestrians.find((p) => p.id === pedId);
    expect(ped?.speed).toBe(2.5);
  });

  it('removeSelectedId clears selectedId and selectedObject', () => {
    const store = useEditorStore.getState();
    store.addCar(0, 0, 0, 'model', 'red');
    expect(useEditorStore.getState().selectedId).not.toBeNull();

    useEditorStore.getState().removeSelectedId();

    expect(useEditorStore.getState().selectedId).toBeNull();
    expect(useEditorStore.getState().selectedObject).toBeNull();
  });
});
