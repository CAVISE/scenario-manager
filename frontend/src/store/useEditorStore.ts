import { create, type StateCreator } from 'zustand';
import { persist, type PersistOptions } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { defaultSimConfig } from '../pages/Editor/Generators/types/configGeneratorsTypes';
import type { EditorState, Car, RSU, Lidar, Building, Point, Scenario } from './types/useEditorStoreTypes';

export type { EditorState, Car, RSU, Lidar, Building, Point, Scenario };
export type { V2XProtocol, BuildingMaterial, CarlaWeather } from './types/useEditorStoreTypes';
export type {SimulationConfig} from '../pages/Editor/Generators/types/configGeneratorsTypes';
type EditorPersist = Pick<EditorState,
  'cars' | 'RSUs' | 'lidars' | 'points' | 'buildings' | 'Scenario' | 'simConfig' | 'selectedId'
>;

const persistOptions: PersistOptions<EditorState, EditorPersist> = {
  name: 'editor-scenario-cache',
  partialize: (state): EditorPersist => ({
    cars:       state.cars,
    RSUs:       state.RSUs,
    lidars:     state.lidars,
    points:     state.points,
    buildings:  state.buildings,
    Scenario:   state.Scenario,
    simConfig:  state.simConfig,  
    selectedId: state.selectedId,
  }),
};

const storeCreator: StateCreator<EditorState> = (set) => ({
  cars:           [],
  points:         [],
  buildings:      [],
  lidars:         [],
  selectedId:     null,
  isBuildingMode: false,
  routes:         [[]],
  RSUs:           [],
  simConfig:      defaultSimConfig,
  Scenario:       { id: Date.now().toString(), name: 'Default Scenario', weather: 'ClearNoon' },

  removeSelectedId: () => set({ selectedId: null }),
  setBuildingMode: value => set({ isBuildingMode: value, ...(value && { selectedId: null }) }),

  updateScenario: (props) =>
    set(s => ({ Scenario: { ...s.Scenario, ...props } })),

  updateSimConfig: props =>
    set(s => ({ simConfig: { ...s.simConfig, ...props } })),

  updateSimConfigOmnet: props =>
    set(s => ({ simConfig: { ...s.simConfig, omnet: { ...s.simConfig.omnet, ...props } } })),

  updateSimConfigArtery: props =>
    set(s => ({ simConfig: { ...s.simConfig, artery: { ...s.simConfig.artery, ...props } } })),

  updateSimConfigSionna: props =>
    set(s => ({ simConfig: { ...s.simConfig, sionna: { ...s.simConfig.sionna, ...props } } })),

  updateSimConfigCarla: props =>
    set(s => ({ simConfig: { ...s.simConfig, carla: { ...s.simConfig.carla, ...props } } })),

  updateSimConfigOpenCDA: props =>
    set(s => ({ simConfig: { ...s.simConfig, opencda: { ...s.simConfig.opencda, ...props } } })),

  addCar: (x, y, z, model, color, speed = 50) => {
    const id = nanoid();
    set(s => ({
      cars:           [...s.cars, { id, x, y, z, model, color, scale: 1, rotation: 0, speed }],
      selectedId:     id,
      isBuildingMode: false,
    }));
    return id;
  },

  updateCar: (id, props) =>
    set(s => ({ cars: s.cars.map(c => (c.id === id ? { ...c, ...props } : c)) })),

  removeCar: id =>
    set(s => ({
      cars:       s.cars.filter(c => c.id !== id),
      points:     s.points.filter(p => p.carId !== id),
      lidars:     s.lidars.filter(l => l.carId !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),

  addRSU: (x, y, z) =>
    set(s => ({
      RSUs: [
        ...s.RSUs,
        {
          id: crypto.randomUUID(), name: `rsu_${s.RSUs.length + 1}`, x, y, z,
          tx_power: 23, frequency: 5.9e9, range: 500,
          protocol: 'ITS-G5', network_protocol: 'GeoNetworking',
          antenna_type: 'isotropic', antenna_height: 5, antenna_gain: 0, polarization: 'vertical',
          mimo_rows: 1, mimo_columns: 1, element_spacing: 0.5,
          azimuth: 0, tilt: 0, cam_interval: 100,
          script: '',
        },
      ],
    })),

  removeRSU: index =>
    set(s => ({ RSUs: s.RSUs.filter((_, i) => i !== index) })),

  updateRSU: (id, props) =>
    set(s => ({ RSUs: s.RSUs.map(r => (r.id === id ? { ...r, ...props } : r)) })),

  addLidar: (carId, x, y, z) => {
    const id = nanoid();
    set(s => ({
      lidars: [
        ...s.lidars,
        { id, carId, x, y, z, rotation: 0, range: 50, channels: 32, rotation_frequency: 10 },
      ],
    }));
    return id;
  },

  updateLidar: (id, props) =>
    set(s => ({ lidars: s.lidars.map(l => (l.id === id ? { ...l, ...props } : l)) })),

  removeLidar: id =>
    set(s => ({ lidars: s.lidars.filter(l => l.id !== id) })),

  removeLidarsByCarId: carId =>
    set(s => ({ lidars: s.lidars.filter(l => l.carId !== carId) })),

  addPoint: (carId, x, y, z) =>
    set(s => ({ points: [...s.points, { id: nanoid(), carId, x, y, z }] })),

  removePoint: id =>
    set(s => ({ points: s.points.filter(p => p.id !== id) })),

  removePointsByCarId: carId =>
    set(s => ({ points: s.points.filter(p => p.carId !== carId) })),

  updatePoint: (id, props) =>
    set(s => ({ points: s.points.map(p => (p.id === id ? { ...p, ...props } : p)) })),

  selectObject: id => set({ selectedId: id }),

  addBuilding: (x, y, z) =>
    set(s => ({
      buildings: [
        ...s.buildings,
        { id: nanoid(), name: `building_${s.buildings.length + 1}`, x, y, z, width: 20, depth: 20, height: 20, material: 'concrete', scale: 0.5, rotation: 0 },
      ],
    })),

  updateBuilding: (id, props) =>
    set(s => ({ buildings: s.buildings.map(b => (b.id === id ? { ...b, ...props } : b)) })),

  removeBuilding: id =>
    set(s => ({ buildings: s.buildings.filter(b => b.id !== id) })),
});

export const useEditorStore = create<EditorState>()(
  persist(storeCreator, persistOptions)
);