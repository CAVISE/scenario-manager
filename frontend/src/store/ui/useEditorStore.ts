import { create, type StateCreator } from 'zustand';
import { persist, type PersistOptions } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import {
  defaultSimConfig,
  mergeSimConfigWithDefaults,
} from '../../pages/Editor/Generators/types/configGeneratorsTypes';
import type {
  EditorState,
  Car,
  RSU,
  Lidar,
  Building,
  Point,
  Scenario,
  Pedestrian,
  DeletedEntity,
  DeletionSnapshot,
} from '../types/useEditorStoreTypes';

export type { EditorState, Car, RSU, Lidar, Building, Point, Scenario };
export type { DeletedEntity, DeletionSnapshot };
export type {
  V2XProtocol,
  BuildingMaterial,
  CarlaWeather,
} from '../types/useEditorStoreTypes';
export type { SimulationConfig } from '../../pages/Editor/Generators/types/configGeneratorsTypes';
export type EditorPersist = Pick<
  EditorState,
  | 'cars'
  | 'RSUs'
  | 'lidars'
  | 'points'
  | 'buildings'
  | 'Scenario'
  | 'simConfig'
  | 'selectedId'
  | 'selectedObject'
  | 'pedestrians'
>;

const persistOptions: PersistOptions<EditorState, EditorPersist> = {
  name: 'editor-scenario-cache',
  version: 1,
  migrate: (persisted) => {
    const state = persisted as Partial<EditorPersist>;
    const simConfig = state.simConfig;
    if (!simConfig?.opencda) return state as EditorPersist;

    return {
      ...state,
      simConfig: {
        ...simConfig,
        opencda: {
          ...simConfig.opencda,
          local_planner: {
            ...simConfig.opencda.local_planner,
            debug: true,
            debug_trajectory: true,
          },
        },
      },
    } as EditorPersist;
  },
  partialize: (state): EditorPersist => ({
    cars: state.cars,
    RSUs: state.RSUs,
    lidars: state.lidars,
    points: state.points,
    buildings: state.buildings,
    Scenario: { ...state.Scenario, file_: null },
    simConfig: state.simConfig,
    selectedId: state.selectedId,
    selectedObject: state.selectedObject,
    pedestrians: state.pedestrians,
  }),
  merge: (persisted, current) => {
    const p = persisted as Partial<EditorPersist> | undefined;

    return {
      ...current,
      ...p,
      Scenario: {
        ...current.Scenario,
        ...p?.Scenario,
        file_: null,
      },
      simConfig: mergeSimConfigWithDefaults(p?.simConfig),
    };
  },
};

const storeCreator: StateCreator<EditorState> = (set, get) => ({
  cars: [],
  error: null,
  pedestrians: [],
  points: [],
  buildings: [],
  lidars: [],
  selectedId: null,
  selectedObject: null,
  isBuildingMode: false,
  routes: [[]],
  RSUs: [],
  simConfig: defaultSimConfig,
  isPanelOpen: true,
  deletionHistory: [],
  Scenario: {
    id: Date.now().toString(),
    name: 'Default Scenario',
    weather: 'ClearNoon',
    description: '',
    file_: null,
  },

  removeSelectedId: () => set({ selectedId: null, selectedObject: null }),
  setBuildingMode: (value) =>
    set({ isBuildingMode: value, ...(value && { selectedId: null }) }),
  updateScenario: (props) =>
    set((s) => ({ Scenario: { ...s.Scenario, ...props } })),

  updateSimConfig: (props) =>
    set((s) => ({
      simConfig: { ...mergeSimConfigWithDefaults(s.simConfig), ...props },
    })),
  setError: (props) => set({ error: props }),
  updateSimConfigOmnet: (props) =>
    set((s) => {
      const simConfig = mergeSimConfigWithDefaults(s.simConfig);
      return {
        simConfig: { ...simConfig, omnet: { ...simConfig.omnet, ...props } },
      };
    }),
  setChangePanelMode: () => set((s) => ({ isPanelOpen: !s.isPanelOpen })),
  updateSimConfigArtery: (props) =>
    set((s) => {
      const simConfig = mergeSimConfigWithDefaults(s.simConfig);
      return {
        simConfig: { ...simConfig, artery: { ...simConfig.artery, ...props } },
      };
    }),

  updateSimConfigSionna: (props) =>
    set((s) => {
      const simConfig = mergeSimConfigWithDefaults(s.simConfig);
      return {
        simConfig: { ...simConfig, sionna: { ...simConfig.sionna, ...props } },
      };
    }),
  updateSimConfigMPC: (props) =>
    set((s) => {
      const simConfig = mergeSimConfigWithDefaults(s.simConfig);
      return {
        simConfig: { ...simConfig, mpc: { ...simConfig.mpc, ...props } },
      };
    }),
  addPedestrian: (x, y, z) => {
    const ped: Pedestrian = {
      id: nanoid(),
      x,
      y,
      z,
      speed: 1.2,
      cross_factor: 0.5,
      is_invincible: false,
      tx_power: 10,
      frequency: 5.9e9,
      protocol: 'DSRC',
      beacon_interval: 1000,
    };

    set((s) => ({
      pedestrians: [...s.pedestrians, ped],
    }));

    return ped.id;
  },

  updatePedestrian: (id, props) =>
    set((s) => ({
      pedestrians: s.pedestrians.map((p) =>
        p.id === id ? { ...p, ...props } : p,
      ),
    })),

  removePedestrian: (id) =>
    set((s) => ({
      pedestrians: s.pedestrians.filter((p) => p.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),

  updateSimConfigCarla: (props) =>
    set((s) => {
      const simConfig = mergeSimConfigWithDefaults(s.simConfig);
      return {
        simConfig: { ...simConfig, carla: { ...simConfig.carla, ...props } },
      };
    }),
  updateSimConfigCAPI: (props) =>
    set((s) => {
      const simConfig = mergeSimConfigWithDefaults(s.simConfig);
      return {
        simConfig: { ...simConfig, capi: { ...simConfig.capi, ...props } },
      };
    }),
  updateSimConfigOpenCDA: (props) =>
    set((s) => {
      const simConfig = mergeSimConfigWithDefaults(s.simConfig);
      return {
        simConfig: {
          ...simConfig,
          opencda: { ...simConfig.opencda, ...props },
        },
      };
    }),
  updateSimConfigSumo: (props) =>
    set((s) => {
      const simConfig = mergeSimConfigWithDefaults(s.simConfig);
      return {
        simConfig: { ...simConfig, sumo: { ...simConfig.sumo, ...props } },
      };
    }),
  addCar: (x, y, z, model, color, speed = 50) => {
    const id = nanoid();
    set((s) => ({
      cars: [
        ...s.cars,
        { id, x, y, z, model, color, scale: 1, rotation: 0, speed },
      ],
      selectedId: id,
      isBuildingMode: false,
    }));
    return id;
  },

  updateCar: (id, props) => {
    set((s) => ({
      cars: s.cars.map((c) => (c.id === id ? { ...c, ...props } : c)),
    }));
  },

  removeCar: (id) =>
    set((s) => {
      return {
        cars: s.cars.filter((c) => c.id !== id),
        points: s.points.filter((p) => p.carId !== id),
        lidars: s.lidars.filter((l) => l.carId !== id),
        selectedId: s.selectedId === id ? null : s.selectedId,
      };
    }),

  addRSU: (x, y, z) => {
    const rsu: RSU = {
      id: nanoid(),
      name: '',
      x,
      y,
      z,
      tx_power: 23,
      frequency: 5.9e9,
      range: 500,
      protocol: 'ITS-G5',
      network_protocol: 'GeoNetworking',
      antenna_type: 'isotropic',
      antenna_height: 5,
      antenna_gain: 0,
      polarization: 'vertical',
      mimo_rows: 1,
      mimo_columns: 1,
      element_spacing: 0.5,
      azimuth: 0,
      tilt: 0,
      cam_interval: 100,
      beacon_interval: 1000,
      script: '',
    };

    set((s) => ({
      RSUs: [
        ...s.RSUs,
        {
          ...rsu,
          name: `rsu_${s.RSUs.length + 1}`,
        },
      ],
    }));

    return rsu.id;
  },

  removeRSU: (index) =>
    set((s) => ({ RSUs: s.RSUs.filter((_, i) => i !== index) })),
  removeAllRSUs: () =>
    set(() => ({
      RSUs: [],
    })),
  updateRSU: (id, props) =>
    set((s) => ({
      RSUs: s.RSUs.map((r) => (r.id === id ? { ...r, ...props } : r)),
    })),

  addLidar: (carId, x, y, z) => {
    const id = nanoid();
    set((s) => ({
      lidars: [
        ...s.lidars,
        {
          id,
          carId,
          x,
          y,
          z,
          rotation: 0,
          range: 50,
          channels: 32,
          rotation_frequency: 10,
        },
      ],
    }));
    return id;
  },

  updateLidar: (id, props) =>
    set((s) => ({
      lidars: s.lidars.map((l) => (l.id === id ? { ...l, ...props } : l)),
    })),

  removeLidar: (id) =>
    set((s) => ({ lidars: s.lidars.filter((l) => l.id !== id) })),

  removeLidarsByCarId: (carId) =>
    set((s) => ({ lidars: s.lidars.filter((l) => l.carId !== carId) })),

  addPoint: (carId, x, y, z) => {
    const id = nanoid();
    set((s) => ({ points: [...s.points, { id, carId, x, y, z }] }));
    return id;
  },

  removePoint: (id) =>
    set((s) => ({ points: s.points.filter((p) => p.id !== id) })),

  removePointsByCarId: (carId) =>
    set((s) => ({ points: s.points.filter((p) => p.carId !== carId) })),

  updatePoint: (id, props) =>
    set((s) => ({
      points: s.points.map((p) => (p.id === id ? { ...p, ...props } : p)),
    })),

  selectObject: (obj) =>
    set(() => {
      const selectedId = obj?.id || null;
      return {
        selectedId,
        selectedObject: obj,
      };
    }),

  addBuilding: (x, y, z) => {
    const id = nanoid();
    set((s) => ({
      buildings: [
        ...s.buildings,
        {
          id,
          name: `building_${s.buildings.length + 1}`,
          x,
          y,
          z,
          width: 20,
          depth: 20,
          height: 20,
          material: 'concrete',
          scale: 0.5,
          rotation: 0,
        },
      ],
    }));
    return id;
  },

  updateBuilding: (id, props) =>
    set((s) => ({
      buildings: s.buildings.map((b) => (b.id === id ? { ...b, ...props } : b)),
    })),

  removeBuilding: (id) =>
    set((s) => ({ buildings: s.buildings.filter((b) => b.id !== id) })),

  pushDeletionSnapshot: (snapshot) => {
    const snapshotId = nanoid();
    set((s) => ({
      deletionHistory: [
        ...s.deletionHistory,
        { ...snapshot, snapshotId, deletedAt: Date.now() },
      ],
    }));
    return snapshotId;
  },

  restoreLastDeletion: (snapshotId) => {
    const s = get();
    if (s.deletionHistory.length === 0) return false;

    const targetIndex = snapshotId
      ? s.deletionHistory.findIndex((h) => h.snapshotId === snapshotId)
      : s.deletionHistory.length - 1;
    if (targetIndex === -1) return false;

    const snapshot = s.deletionHistory[targetIndex];

    set((state) => {
      const cars = [...state.cars];
      const RSUs = [...state.RSUs];
      const buildings = [...state.buildings];
      const pedestrians = [...state.pedestrians];
      const lidars = [...state.lidars];
      const points = [...state.points];

      const insertAt = (arr: unknown[], index: number) =>
        Math.min(Math.max(index, 0), arr.length);

      for (const entity of snapshot.entities) {
        switch (entity.kind) {
          case 'car': {
            cars.splice(insertAt(cars, entity.index), 0, entity.car);

            points.push(...entity.points);
            lidars.push(...entity.lidars);
            break;
          }
          case 'rsu':
            RSUs.splice(insertAt(RSUs, entity.index), 0, entity.rsu);
            break;
          case 'building':
            buildings.splice(
              insertAt(buildings, entity.index),
              0,
              entity.building,
            );
            break;
          case 'pedestrian':
            pedestrians.splice(
              insertAt(pedestrians, entity.index),
              0,
              entity.pedestrian,
            );
            break;
          case 'lidar':
            lidars.splice(insertAt(lidars, entity.index), 0, entity.lidar);
            break;
          case 'point':
            points.splice(insertAt(points, entity.index), 0, entity.point);
            break;
        }
      }

      return {
        cars,
        RSUs,
        buildings,
        pedestrians,
        lidars,
        points,
        deletionHistory: state.deletionHistory.filter(
          (h) => h.snapshotId !== snapshot.snapshotId,
        ),
      };
    });

    return true;
  },

  clearDeletionHistory: () => set({ deletionHistory: [] }),
});

export const useEditorStore = create<EditorState>()(
  persist(storeCreator, persistOptions),
);

if (import.meta.env.DEV && typeof window !== 'undefined') {
  // @ts-expect-error Exposed only as a development console helper.
  window.useEditorStore = useEditorStore;
}
