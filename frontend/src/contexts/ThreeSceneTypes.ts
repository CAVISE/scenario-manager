import type * as THREE from 'three';
import type { TransformControls } from 'three-stdlib';
import type { SelectedObject } from '../pages/Editor/types/editorTypes';
import { type Car, type RSU, type Lidar, type Building, type Point, type Pedestrian } from '../store/types/useEditorStoreTypes';
import type { MutableRefObject } from 'react';

export interface ThreeSceneRefs {
  sceneRef: MutableRefObject<THREE.Scene | undefined>;
  cameraRef: MutableRefObject<THREE.PerspectiveCamera | undefined>;
  transformControlsRef: MutableRefObject<TransformControls | null>;

  carMeshesRef: MutableRefObject<THREE.Mesh[]>;
  carQuaternionsRef: MutableRefObject<Map<string, THREE.Quaternion>>;
  pointsArrRef: MutableRefObject<THREE.Mesh[]>;
  pointsObjsRef: MutableRefObject<THREE.Mesh[]>;
  cubeCirclesRef: MutableRefObject<THREE.Mesh[][]>;
  pedestrianObjsRef: MutableRefObject<THREE.Mesh[]>;
  rsuMeshesRef: MutableRefObject<THREE.Mesh[]>;
  roadMeshRef: MutableRefObject<THREE.Mesh | null>;
  pedestrianMeshesRef: MutableRefObject<THREE.Mesh[]>;

  currentCarRef: MutableRefObject<string>;
  currentColorRef: MutableRefObject<string>;
  isDraggingRef: MutableRefObject<boolean>;

  loadPointsRef: MutableRefObject<() => void>;
  loadRSURef: MutableRefObject<() => void>;

  modeRef: MutableRefObject<{
    isAddCarModeActive: boolean;
    isAddPointModeActive: boolean;
    isAddPedestrianModeActive: boolean;
    isAddedPoints: boolean;
  }>;

  buildingModelRef: MutableRefObject<THREE.Object3D | null>;

  // Functions for updating objects
  addCar: (x: number, y: number, z: number, model: string, color: string, speed?: number) => string;
  updateCar: (id: string, props: Partial<Omit<Car, 'id'>>) => void;
  removeCar: (id: string) => void;
  selectObject: (obj: SelectedObject | null) => void;
  addRSU: (x: number, y: number, z: number) => void;
  removeRSU: (id: number) => void;
  updateRSU: (id: string, props: Partial<Omit<RSU, 'id'>>) => void;
  addLidar: (carId: string, x: number, y: number, z: number) => string;
  updateLidar: (id: string, props: Partial<Omit<Lidar, 'id' | 'carId'>>) => void;
  removeLidar: (id: string) => void;
  removeLidarsByCarId: (carId: string) => void;
  addPoint: (carId: string, x: number, y: number, z: number) => void;
  removePoint: (id: string) => void;
  removePointsByCarId: (carId: string) => void;
  updatePoint: (id: string, props: Partial<Omit<Point, 'id' | 'carId'>>) => void;
  addBuilding: (x: number, y: number, z: number) => void;
  updateBuilding: (id: string, props: Partial<Omit<Building, 'id'>>) => void;
  removeBuilding: (id: string) => void;
  addPedestrian: (x: number, y: number, z: number) => string;
  updatePedestrian: (id: string, props: Partial<Omit<Pedestrian, 'id'>>) => void;
  removePedestrian: (id: string) => void;
  setBuildingMode: (value: boolean) => void;
  removeSelectedId: () => void;
  
  updateSceneGraph: () => void;
  setSelectedObject: (obj: SelectedObject | null | ((prev: SelectedObject | null) => SelectedObject | null)) => void;
}