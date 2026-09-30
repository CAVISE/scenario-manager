import { nanoid } from 'nanoid';
import type { StateCreator } from 'zustand';
import {
  createCar,
  createLidar,
  createPoint,
  removeLidar,
  removeLidarsByVehicleId,
  removePoint,
  removePointsByVehicleId,
  removeVehicle,
  updateCar,
  updateLidar,
  updatePoint,
} from '@/entities/vehicle';
import {
  createBuilding,
  removeBuilding,
  updateBuilding,
} from '@/entities/building';
import {
  createPedestrian,
  removePedestrian,
  updatePedestrian,
} from '@/entities/pedestrian';
import {
  createRsu,
  removeRsuAtIndex,
  updateRsu,
} from '@/entities/roadside-unit';
import type { EditorState } from '../../types/useEditorStoreTypes';

type SceneSlice = Pick<
  EditorState,
  | 'cars'
  | 'RSUs'
  | 'lidars'
  | 'points'
  | 'buildings'
  | 'pedestrians'
  | 'selectedIds'
  | 'selectedObjects'
  | 'isBuildingMode'
  | 'routes'
  | 'clearSelection'
  | 'setBuildingMode'
  | 'addCar'
  | 'addCarsBatch'
  | 'updateCar'
  | 'removeCar'
  | 'removeAllCars'
  | 'addPedestrian'
  | 'addPedestriansBatch'
  | 'updatePedestrian'
  | 'removePedestrian'
  | 'removeAllPedestrians'
  | 'addRSU'
  | 'addRSUsBatch'
  | 'removeRSU'
  | 'removeAllRSUs'
  | 'updateRSU'
  | 'addLidar'
  | 'addLidarsBatch'
  | 'updateLidar'
  | 'removeLidar'
  | 'removeLidarsByCarId'
  | 'addPoint'
  | 'addPointsBatch'
  | 'removePoint'
  | 'removePointsByCarId'
  | 'updatePoint'
  | 'selectObjects'
  | 'toggleObjectSelection'
  | 'addBuilding'
  | 'addBuildingsBatch'
  | 'updateBuilding'
  | 'removeBuilding'
  | 'removeAllBuildings'
>;

export const createSceneSlice: StateCreator<EditorState, [], [], SceneSlice> = (
  set,
  get
) => ({
  cars: [],
  pedestrians: [],
  points: [],
  buildings: [],
  lidars: [],
  selectedIds: [],
  selectedObjects: [],
  isBuildingMode: false,
  routes: [[]],
  RSUs: [],

  clearSelection: () => set({ selectedIds: [], selectedObjects: [] }),
  setBuildingMode: (value) =>
    set({ isBuildingMode: value, ...(value && { selectedIds: [] }) }),

  addPedestrian: (x, y, z) => {
    const pedestrian = createPedestrian({ id: nanoid(), x, y, z });
    set((state) => ({ pedestrians: [...state.pedestrians, pedestrian] }));
    return pedestrian.id;
  },
  addPedestriansBatch: (pedestrians) => {
    const withIds = pedestrians.map((pedestrian) => ({
      ...pedestrian,
      id: nanoid(),
    }));
    set((state) => ({ pedestrians: [...state.pedestrians, ...withIds] }));
    return withIds.map((pedestrian) => pedestrian.id);
  },
  updatePedestrian: (id, props) =>
    set((state) => ({
      pedestrians: updatePedestrian(state.pedestrians, id, props),
    })),
  removePedestrian: (id) => set((state) => removePedestrian(state, id)),
  removeAllPedestrians: () => set({ pedestrians: [] }),

  addCar: (x, y, z, model, color, speed = 50) => {
    const id = nanoid();
    set((state) => ({
      cars: [...state.cars, createCar({ id, x, y, z, model, color, speed })],
      selectedIds: [id],
      isBuildingMode: false,
    }));
    return id;
  },
  addCarsBatch: (cars) => {
    const withIds = cars.map((car) => ({ ...car, id: nanoid() }));
    set((state) => ({ cars: [...state.cars, ...withIds] }));
    return withIds.map((car) => car.id);
  },
  updateCar: (id, props) =>
    set((state) => ({ cars: updateCar(state.cars, id, props) })),
  removeCar: (id) => set((state) => removeVehicle(state, id)),
  removeAllCars: () => set({ cars: [], points: [], lidars: [] }),

  addRSU: (x, y, z) => {
    const rsu = createRsu({
      id: nanoid(),
      name: `rsu_${get().RSUs.length + 1}`,
      x,
      y,
      z,
    });
    set((state) => ({ RSUs: [...state.RSUs, rsu] }));
    return rsu.id;
  },
  addRSUsBatch: (rsus) => {
    const withIds = rsus.map((rsu, index) => ({
      ...rsu,
      id: nanoid(),
      name: rsu.name || `rsu_${index + 1}`,
    }));
    set((state) => ({ RSUs: [...state.RSUs, ...withIds] }));
    return withIds.map((rsu) => rsu.id);
  },
  removeRSU: (index) =>
    set((state) => ({ RSUs: removeRsuAtIndex(state.RSUs, index) })),
  removeAllRSUs: () => set({ RSUs: [] }),
  updateRSU: (id, props) =>
    set((state) => ({ RSUs: updateRsu(state.RSUs, id, props) })),

  addLidar: (carId, x, y, z) => {
    const id = nanoid();
    set((state) => ({
      lidars: [...state.lidars, createLidar({ id, carId, x, y, z })],
    }));
    return id;
  },
  addLidarsBatch: (lidars) => {
    const withIds = lidars.map((lidar) => ({ ...lidar, id: nanoid() }));
    set((state) => ({ lidars: [...state.lidars, ...withIds] }));
    return withIds.map((lidar) => lidar.id);
  },
  updateLidar: (id, props) =>
    set((state) => ({ lidars: updateLidar(state.lidars, id, props) })),
  removeLidar: (id) =>
    set((state) => ({ lidars: removeLidar(state.lidars, id) })),
  removeLidarsByCarId: (carId) =>
    set((state) => ({
      lidars: removeLidarsByVehicleId(state.lidars, carId),
    })),

  addPoint: (carId, x, y, z) => {
    const id = nanoid();
    set((state) => ({
      points: [...state.points, createPoint({ id, carId, x, y, z })],
    }));
    return id;
  },
  addPointsBatch: (points) => {
    const withIds = points.map((point) => ({ ...point, id: nanoid() }));
    set((state) => ({ points: [...state.points, ...withIds] }));
    return withIds.map((point) => point.id);
  },
  removePoint: (id) =>
    set((state) => ({ points: removePoint(state.points, id) })),
  removePointsByCarId: (carId) =>
    set((state) => ({
      points: removePointsByVehicleId(state.points, carId),
    })),
  updatePoint: (id, props) =>
    set((state) => ({ points: updatePoint(state.points, id, props) })),

  selectObjects: (objects) =>
    set({
      selectedIds: objects
        .map((object) => object.id)
        .filter((id): id is string => typeof id === 'string'),
      selectedObjects: objects,
    }),
  toggleObjectSelection: (object) => {
    const objectId = object.id;
    if (typeof objectId !== 'string') return;

    set((state) => {
      const isSelected = state.selectedIds.includes(objectId);
      return {
        selectedIds: isSelected
          ? state.selectedIds.filter((id) => id !== objectId)
          : [...state.selectedIds, objectId],
        selectedObjects: isSelected
          ? state.selectedObjects.filter((item) => item.id !== objectId)
          : [...state.selectedObjects, object],
      };
    });
  },

  addBuilding: (x, y, z) => {
    const id = nanoid();
    set((state) => ({
      buildings: [
        ...state.buildings,
        createBuilding({
          id,
          name: `building_${state.buildings.length + 1}`,
          x,
          y,
          z,
        }),
      ],
    }));
    return id;
  },
  addBuildingsBatch: (buildings) => {
    const withIds = buildings.map((building, index) => ({
      ...building,
      id: nanoid(),
      name: building.name || `building_${index + 1}`,
    }));
    set((state) => ({ buildings: [...state.buildings, ...withIds] }));
    return withIds.map((building) => building.id);
  },
  updateBuilding: (id, props) =>
    set((state) => ({
      buildings: updateBuilding(state.buildings, id, props),
    })),
  removeBuilding: (id) =>
    set((state) => ({ buildings: removeBuilding(state.buildings, id) })),
  removeAllBuildings: () => set({ buildings: [] }),
});
