import type * as THREE from 'three';
import type { LOADING_STEPS } from '../../types/editorTypes';
import type { SelectedObject } from '../../types/editorTypes';
import type { Car, RSU, Point } from '../../../../store/types/useEditorStoreTypes';
import { TransformControls } from 'three-stdlib';

export interface UseThreeSceneOptions {
  sceneRef:             React.MutableRefObject<THREE.Scene | undefined>;
  cameraRef:            React.MutableRefObject<THREE.PerspectiveCamera | undefined>;
  transformControlsRef: React.MutableRefObject<TransformControls | null>;
  carMeshesRef:         React.MutableRefObject<THREE.Mesh[]>;
  carQuaternionsRef:    React.MutableRefObject<Map<string, THREE.Quaternion>>;
  pointsArrRef:         React.MutableRefObject<THREE.Mesh[]>;
  pointsObjsRef:        React.MutableRefObject<THREE.Mesh[]>;
  cubeCirclesRef:       React.MutableRefObject<THREE.Mesh[][]>;
  roadMeshRef:          React.MutableRefObject<THREE.Mesh | null>;
  currentCarRef:        React.MutableRefObject<string>;
  currentColorRef:      React.MutableRefObject<string>;
  loadPointsRef:        React.MutableRefObject<() => void>;
  modeRef:              React.MutableRefObject<{
    isAddCarModeActive:   boolean;
    isAddPointModeActive: boolean;
    isAddedPoints:        boolean;
  }>;
  buildingModelRef: React.MutableRefObject<THREE.Object3D | null>;

  setStep:             (step: keyof typeof LOADING_STEPS) => void;
  updateSceneGraph:    () => void;
  setSelectedObject: (obj: SelectedObject | null | ((prev: SelectedObject | null) => SelectedObject | null)) => void;

  addCar:              (x: number, y: number, z: number, model: string, color: string, speed?: number) => string;
  updateCar:           (id: string, data: Partial<Car>) => void;
  deleteCar:           (id: string) => void;
  selectObject:        (id: string | null) => void;
  addRSU:              (x: number, y: number, z: number) => void;
  updateRSU:           (id: string, data: Partial<RSU>) => void;
  removePointsByCarId: (carId: string) => void;
  addPoint:            (carId: string, x: number, y: number, z: number) => void;
  updatePoint:         (id: string, data: Partial<Point>) => void;
  addBuilding:         (x: number, y: number, z: number) => void;
  setBuildingMode:     (v: boolean) => void;
  setError: (error: Error)=>void
}

export interface UseThreeSceneResult {
  actionsRef: React.MutableRefObject<{
    addCube:    () => void;
    addRSU:     () => void;
    addPoints:  () => void;
    deleteCar:  () => void;
    deleteCube: () => void;
  }>;
}