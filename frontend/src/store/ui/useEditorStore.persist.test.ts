import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { SimulationConfig, useEditorStore } from './useEditorStore';
import { SelectedObject } from '../../pages/Editor/types/editorTypes';

let nanoidCounter = 0;
vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => `test-id-${++nanoidCounter}`),
}));

vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'uuid-rsu') });

beforeEach(() => {
  nanoidCounter = 0;
  const store = useEditorStore.getState();
  act(() => {
    store.cars.forEach((c) => store.removeCar(c.id));
    store.RSUs.forEach((_, i) => store.removeRSU(i));
    store.lidars.forEach((l) => store.removeLidar(l.id));
    store.points.forEach((p) => store.removePoint(p.id));
    store.buildings.forEach((b) => store.removeBuilding(b.id));
    store.pedestrians.forEach((p) => store.removePedestrian(p.id));
  });
  act(() => {
    useEditorStore.setState({
      cars: [],
      RSUs: [],
      lidars: [],
      points: [],
      buildings: [],
      pedestrians: [],
      selectedId: null,
      selectedObject: null,
      isBuildingMode: false,
      isPanelOpen: true,
      error: null,
    });
  });
});

describe('updateScenario', () => {
  it('merges props into existing scenario', () => {
    act(() =>
      useEditorStore
        .getState()
        .updateScenario({ name: 'My Scenario', weather: 'CloudySunset' })
    );
    const { Scenario } = useEditorStore.getState();
    expect(Scenario.name).toBe('My Scenario');
    expect(Scenario.weather).toBe('CloudySunset');
    expect(Scenario.description).toBe('');
  });
});

describe('setBuildingMode', () => {
  it('sets isBuildingMode to true and clears selectedId', () => {
    act(() => {
      useEditorStore.setState({ selectedId: 'some-id' });
      useEditorStore.getState().setBuildingMode(true);
    });
    const state = useEditorStore.getState();
    expect(state.isBuildingMode).toBe(true);
    expect(state.selectedId).toBeNull();
  });

  it('sets isBuildingMode to false without clearing selectedId', () => {
    act(() => {
      useEditorStore.setState({ selectedId: 'some-id', isBuildingMode: true });
      useEditorStore.getState().setBuildingMode(false);
    });
    const state = useEditorStore.getState();
    expect(state.isBuildingMode).toBe(false);
    expect(state.selectedId).toBe('some-id');
  });
});

describe('setChangePanelMode', () => {
  it('toggles isPanelOpen', () => {
    expect(useEditorStore.getState().isPanelOpen).toBe(true);
    act(() => useEditorStore.getState().setChangePanelMode());
    expect(useEditorStore.getState().isPanelOpen).toBe(false);
    act(() => useEditorStore.getState().setChangePanelMode());
    expect(useEditorStore.getState().isPanelOpen).toBe(true);
  });
});

describe('setError', () => {
  it('stores error message', () => {
    act(() => useEditorStore.getState().setError(new Error('something broke')));
    expect(useEditorStore.getState().error).toBeInstanceOf(Error);
    expect(useEditorStore.getState().error?.message).toBe('something broke');
  });

  it('clears error with null', () => {
    act(() => {
      useEditorStore.getState().setError(new Error('oops'));
      useEditorStore.getState().setError(null);
    });
    expect(useEditorStore.getState().error).toBeNull();
  });
});

describe('addCar', () => {
  it('adds a car and returns its id', () => {
    let id: string;
    act(() => {
      id = useEditorStore.getState().addCar(1, 2, 3, 'sedan', 'red');
    });
    const { cars, selectedId, isBuildingMode } = useEditorStore.getState();
    expect(cars).toHaveLength(1);
    expect(cars[0]).toMatchObject({
      x: 1,
      y: 2,
      z: 3,
      model: 'sedan',
      color: 'red',
      speed: 50,
    });
    expect(selectedId).toBe(id!);
    expect(isBuildingMode).toBe(false);
  });

  it('respects custom speed', () => {
    act(() => useEditorStore.getState().addCar(0, 0, 0, 'truck', 'blue', 80));
    expect(useEditorStore.getState().cars[0].speed).toBe(80);
  });
});

describe('updateCar', () => {
  it('patches a car by id', () => {
    let id: string;
    act(() => {
      id = useEditorStore.getState().addCar(0, 0, 0, 'sedan', 'red');
    });
    act(() =>
      useEditorStore.getState().updateCar(id!, { speed: 120, color: 'green' })
    );
    const car = useEditorStore.getState().cars.find((c) => c.id === id!);
    expect(car?.speed).toBe(120);
    expect(car?.color).toBe('green');
  });
});

describe('removeCar', () => {
  it('removes the car, its points, and its lidars', () => {
    let carId: string;
    act(() => {
      carId = useEditorStore.getState().addCar(0, 0, 0, 'sedan', 'red');
      useEditorStore.getState().addPoint(carId!, 1, 2, 3);
      useEditorStore.getState().addLidar(carId!, 0, 0, 0);
    });
    act(() => useEditorStore.getState().removeCar(carId!));
    const { cars, points, lidars } = useEditorStore.getState();
    expect(cars).toHaveLength(0);
    expect(points.filter((p) => p.carId === carId!)).toHaveLength(0);
    expect(lidars.filter((l) => l.carId === carId!)).toHaveLength(0);
  });

  it('clears selectedId when removing the selected car', () => {
    let id: string;
    act(() => {
      id = useEditorStore.getState().addCar(0, 0, 0, 'sedan', 'red');
    });
    expect(useEditorStore.getState().selectedId).toBe(id!);
    act(() => useEditorStore.getState().removeCar(id!));
    expect(useEditorStore.getState().selectedId).toBeNull();
  });

  it('preserves selectedId when removing a different car', () => {
    let id1: string, id2: string;
    act(() => {
      id1 = useEditorStore.getState().addCar(0, 0, 0, 'sedan', 'red');
      id2 = useEditorStore.getState().addCar(1, 1, 1, 'suv', 'blue');
      useEditorStore.setState({ selectedId: id1 });
    });
    act(() => useEditorStore.getState().removeCar(id2!));
    expect(useEditorStore.getState().selectedId).toBe(id1!);
  });
});

describe('addRSU', () => {
  it('adds an RSU with defaults', () => {
    act(() => useEditorStore.getState().addRSU(10, 20, 5));
    const { RSUs } = useEditorStore.getState();
    expect(RSUs).toHaveLength(1);
    expect(RSUs[0]).toMatchObject({
      x: 10,
      y: 20,
      z: 5,
      tx_power: 23,
      range: 500,
      protocol: 'ITS-G5',
      antenna_type: 'isotropic',
    });
    expect(RSUs[0].name).toBe('rsu_1');
  });

  it('increments RSU name index', () => {
    act(() => {
      useEditorStore.getState().addRSU(0, 0, 0);
      useEditorStore.getState().addRSU(1, 1, 1);
    });
    expect(useEditorStore.getState().RSUs[1].name).toBe('rsu_2');
  });
});

describe('updateRSU', () => {
  it('patches RSU by id', () => {
    act(() => useEditorStore.getState().addRSU(0, 0, 0));
    const { RSUs } = useEditorStore.getState();
    act(() =>
      useEditorStore
        .getState()
        .updateRSU(RSUs[0].id, { tx_power: 30, range: 1000 })
    );
    expect(useEditorStore.getState().RSUs[0].tx_power).toBe(30);
    expect(useEditorStore.getState().RSUs[0].range).toBe(1000);
  });
});

describe('removeRSU', () => {
  it('removes RSU by index', () => {
    act(() => {
      useEditorStore.getState().addRSU(0, 0, 0);
      useEditorStore.getState().addRSU(1, 1, 1);
    });
    act(() => useEditorStore.getState().removeRSU(0));
    expect(useEditorStore.getState().RSUs).toHaveLength(1);
  });
});

describe('addLidar', () => {
  it('adds a lidar with defaults and returns id', () => {
    let id: string;
    act(() => {
      id = useEditorStore.getState().addLidar('car-1', 0, 0, 2);
    });
    const { lidars } = useEditorStore.getState();
    expect(lidars).toHaveLength(1);
    expect(lidars[0]).toMatchObject({
      carId: 'car-1',
      x: 0,
      y: 0,
      z: 2,
      range: 50,
      channels: 32,
      rotation_frequency: 10,
    });
    expect(id!).toBeTruthy();
  });
});

describe('updateLidar', () => {
  it('patches lidar by id', () => {
    let id: string;
    act(() => {
      id = useEditorStore.getState().addLidar('car-1', 0, 0, 0);
    });
    act(() =>
      useEditorStore.getState().updateLidar(id!, { range: 100, channels: 64 })
    );
    const lidar = useEditorStore.getState().lidars[0];
    expect(lidar.range).toBe(100);
    expect(lidar.channels).toBe(64);
  });
});

describe('removeLidar', () => {
  it('removes lidar by id', () => {
    let id: string;
    act(() => {
      id = useEditorStore.getState().addLidar('car-1', 0, 0, 0);
    });
    act(() => useEditorStore.getState().removeLidar(id!));
    expect(useEditorStore.getState().lidars).toHaveLength(0);
  });
});

describe('removeLidarsByCarId', () => {
  it('removes only lidars belonging to the given car', () => {
    act(() => {
      useEditorStore.getState().addLidar('car-1', 0, 0, 0);
      useEditorStore.getState().addLidar('car-1', 1, 0, 0);
      useEditorStore.getState().addLidar('car-2', 0, 0, 0);
    });
    act(() => useEditorStore.getState().removeLidarsByCarId('car-1'));
    const { lidars } = useEditorStore.getState();
    expect(lidars).toHaveLength(1);
    expect(lidars[0].carId).toBe('car-2');
  });
});

describe('addPoint', () => {
  it('adds a waypoint', () => {
    act(() => useEditorStore.getState().addPoint('car-1', 5, 6, 0));
    expect(useEditorStore.getState().points).toHaveLength(1);
    expect(useEditorStore.getState().points[0]).toMatchObject({
      carId: 'car-1',
      x: 5,
      y: 6,
      z: 0,
    });
  });
});

describe('updatePoint', () => {
  it('patches point by id', () => {
    act(() => useEditorStore.getState().addPoint('car-1', 0, 0, 0));
    const { points } = useEditorStore.getState();
    act(() => useEditorStore.getState().updatePoint(points[0].id, { x: 99 }));
    expect(useEditorStore.getState().points[0].x).toBe(99);
  });
});

describe('removePoint', () => {
  it('removes point by id', () => {
    act(() => useEditorStore.getState().addPoint('car-1', 0, 0, 0));
    const { points } = useEditorStore.getState();
    act(() => useEditorStore.getState().removePoint(points[0].id));
    expect(useEditorStore.getState().points).toHaveLength(0);
  });
});

describe('removePointsByCarId', () => {
  it('removes only points for given car', () => {
    act(() => {
      useEditorStore.getState().addPoint('car-1', 0, 0, 0);
      useEditorStore.getState().addPoint('car-2', 1, 1, 0);
    });
    act(() => useEditorStore.getState().removePointsByCarId('car-1'));
    expect(
      useEditorStore.getState().points.every((p) => p.carId === 'car-2')
    ).toBe(true);
  });
});

describe('addBuilding', () => {
  it('adds a building with default dimensions', () => {
    act(() => useEditorStore.getState().addBuilding(0, 0, 0));
    const { buildings } = useEditorStore.getState();
    expect(buildings).toHaveLength(1);
    expect(buildings[0]).toMatchObject({
      x: 0,
      y: 0,
      z: 0,
      width: 20,
      depth: 20,
      height: 20,
      material: 'concrete',
    });
    expect(buildings[0].name).toBe('building_1');
  });
});

describe('updateBuilding', () => {
  it('patches building by id', () => {
    act(() => useEditorStore.getState().addBuilding(0, 0, 0));
    const { buildings } = useEditorStore.getState();
    act(() =>
      useEditorStore
        .getState()
        .updateBuilding(buildings[0].id, { height: 50, material: 'glass' })
    );
    expect(useEditorStore.getState().buildings[0].height).toBe(50);
    expect(useEditorStore.getState().buildings[0].material).toBe('glass');
  });
});

describe('removeBuilding', () => {
  it('removes building by id', () => {
    act(() => useEditorStore.getState().addBuilding(0, 0, 0));
    const { buildings } = useEditorStore.getState();
    act(() => useEditorStore.getState().removeBuilding(buildings[0].id));
    expect(useEditorStore.getState().buildings).toHaveLength(0);
  });
});

describe('addPedestrian', () => {
  it('adds a pedestrian with defaults and returns id', () => {
    let id: string;
    act(() => {
      id = useEditorStore.getState().addPedestrian(3, 4, 0);
    });
    const { pedestrians } = useEditorStore.getState();
    expect(pedestrians).toHaveLength(1);
    expect(pedestrians[0]).toMatchObject({
      x: 3,
      y: 4,
      z: 0,
      speed: 1.2,
      is_invincible: false,
      protocol: 'DSRC',
    });
    expect(id!).toBeTruthy();
  });
});

describe('updatePedestrian', () => {
  it('patches pedestrian by id', () => {
    let id: string;
    act(() => {
      id = useEditorStore.getState().addPedestrian(0, 0, 0);
    });
    act(() =>
      useEditorStore
        .getState()
        .updatePedestrian(id!, { speed: 2.5, is_invincible: true })
    );
    const ped = useEditorStore.getState().pedestrians[0];
    expect(ped.speed).toBe(2.5);
    expect(ped.is_invincible).toBe(true);
  });
});

describe('removePedestrian', () => {
  it('removes pedestrian by id and clears selectedId if matched', () => {
    let id: string;
    act(() => {
      id = useEditorStore.getState().addPedestrian(0, 0, 0);
    });
    act(() => useEditorStore.setState({ selectedId: id! }));
    act(() => useEditorStore.getState().removePedestrian(id!));
    expect(useEditorStore.getState().pedestrians).toHaveLength(0);
    expect(useEditorStore.getState().selectedId).toBeNull();
  });

  it('preserves selectedId when removing a different pedestrian', () => {
    let id1: string, id2: string;
    act(() => {
      id1 = useEditorStore.getState().addPedestrian(0, 0, 0);
      id2 = useEditorStore.getState().addPedestrian(1, 1, 0);
      useEditorStore.setState({ selectedId: id1 });
    });
    act(() => useEditorStore.getState().removePedestrian(id2!));
    expect(useEditorStore.getState().selectedId).toBe(id1!);
  });
});

describe('selectObject', () => {
  it('sets selectedId and selectedObject', () => {
    const obj = { id: 'abc', type: 'car' } as unknown as SelectedObject;
    act(() => useEditorStore.getState().selectObject(obj));
    expect(useEditorStore.getState().selectedId).toBe('abc');
    expect(useEditorStore.getState().selectedObject).toBe(obj);
  });

  it('clears selection when called with null', () => {
    act(() => {
      useEditorStore.getState().selectObject({ id: 'x' } as SelectedObject);
      useEditorStore.getState().selectObject(null as unknown as SelectedObject);
    });
    expect(useEditorStore.getState().selectedId).toBeNull();
    expect(useEditorStore.getState().selectedObject).toBeNull();
  });
});

describe('removeSelectedId', () => {
  it('clears both selectedId and selectedObject', () => {
    act(() => {
      useEditorStore.getState().selectObject({ id: 'x' } as SelectedObject);
      useEditorStore.getState().removeSelectedId();
    });
    expect(useEditorStore.getState().selectedId).toBeNull();
    expect(useEditorStore.getState().selectedObject).toBeNull();
  });
});

describe('updateSimConfig', () => {
  it('merges top-level sim config keys', () => {
    act(() =>
      useEditorStore.getState().updateSimConfig({
        someTopLevelKey: 'value',
      } as unknown as SimulationConfig)
    );
    expect(
      (useEditorStore.getState().simConfig as SimulationConfig).sim_duration
    ).toBe(100);
  });
});

describe('updateSimConfigOmnet', () => {
  it('merges into simConfig.omnet', () => {
    act(() =>
      useEditorStore.getState().updateSimConfigOmnet({ someKey: 42 } as object)
    );
    expect(
      (
        useEditorStore.getState().simConfig.omnet as unknown as {
          someKey: number;
        }
      ).someKey
    ).toBe(42);
  });
});

describe('updateSimConfigArtery', () => {
  it('merges into simConfig.artery', () => {
    act(() =>
      useEditorStore
        .getState()
        .updateSimConfigArtery({ someKey: 'a' } as object)
    );
    expect(
      (
        useEditorStore.getState().simConfig.artery as unknown as {
          someKey: string;
        }
      ).someKey
    ).toBe('a');
  });
});

describe('updateSimConfigSionna', () => {
  it('merges into simConfig.sionna', () => {
    act(() =>
      useEditorStore.getState().updateSimConfigSionna({ freq: 28e9 } as object)
    );
    expect(
      (
        useEditorStore.getState().simConfig.sionna as unknown as {
          freq: number;
        }
      ).freq
    ).toBe(28e9);
  });
});

describe('updateSimConfigMPC', () => {
  it('merges into simConfig.mpc', () => {
    act(() =>
      useEditorStore.getState().updateSimConfigMPC({ order: 4 } as object)
    );
    expect(
      (useEditorStore.getState().simConfig.mpc as unknown as { order: number })
        .order
    ).toBe(4);
  });
});

describe('updateSimConfigCarla', () => {
  it('merges into simConfig.carla', () => {
    act(() =>
      useEditorStore.getState().updateSimConfigCarla({ port: 2000 } as object)
    );
    expect(
      (useEditorStore.getState().simConfig.carla as unknown as { port: number })
        .port
    ).toBe(2000);
  });
});

describe('updateSimConfigCAPI', () => {
  it('merges into simConfig.capi', () => {
    act(() =>
      useEditorStore
        .getState()
        .updateSimConfigCAPI({ endpoint: '/api' } as object)
    );
    expect(
      (
        useEditorStore.getState().simConfig.capi as unknown as {
          endpoint: string;
        }
      ).endpoint
    ).toBe('/api');
  });
});

describe('updateSimConfigOpenCDA', () => {
  it('merges into simConfig.opencda', () => {
    act(() =>
      useEditorStore
        .getState()
        .updateSimConfigOpenCDA({ scenario: 'highway' } as object)
    );
    expect(
      (
        useEditorStore.getState().simConfig.opencda as unknown as {
          scenario: string;
        }
      ).scenario
    ).toBe('highway');
  });
});

describe('updateSimConfigSumo', () => {
  it('merges into simConfig.sumo', () => {
    act(() =>
      useEditorStore
        .getState()
        .updateSimConfigSumo({ step_length: 0.5 } as object)
    );
    expect(
      (
        useEditorStore.getState().simConfig.sumo as unknown as {
          step_length: number;
        }
      ).step_length
    ).toBe(0.5);
  });
});
