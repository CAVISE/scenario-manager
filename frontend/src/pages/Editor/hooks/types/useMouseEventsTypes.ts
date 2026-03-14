import type { SelectedObject } from '../../types/editorTypes';
import * as THREE from 'three';
import { TransformControls } from 'three-stdlib';
import { Car, Point, RSU } from '../../../../store/useEditorStore';
export interface UseMouseEventsOptions {
  getScene: () => THREE.Scene | undefined;
  getCamera: () => THREE.PerspectiveCamera | undefined;
  getTransformControls: () => TransformControls | null;

  getCarMeshes:   () => THREE.Mesh[];
  getPointsArr:   () => THREE.Mesh[];
  getPointsObjs:  () => THREE.Mesh[];          
  getCubeCircles: () => THREE.Mesh[][];
  updateSceneGraph: () => void; 
  getRoadMesh: () => THREE.Mesh | null;

  modeRef: React.MutableRefObject<{
    isAddCarModeActive:   boolean;
    isAddPointModeActive: boolean;
    isAddedPoints:        boolean;
  }>;

  buildingModelRef: React.MutableRefObject<THREE.Object3D | null>;

  onSelectObject:   (obj: SelectedObject | null) => void;
  onDetachControls: () => void;
  onDeleteCube:     () => void;
  onLoadPoints:     () => void;

  addCar:          (x: number, y: number, z: number, model: string, color: string, speed?: number) => string;
  addRSU:          (x: number, y: number, z: number) => void;
  addPoint:        (carId: string, x: number, y: number, z: number) => void;
  addBuilding:     (x: number, y: number, z: number) => void;
  updateCar:       (id: string, data: Partial<Car>) => void;
  updatePoint:     (id: string, data: Partial<Point>) => void;
  updateRSU:       (id: string, data: Partial<RSU>) => void;
  removeRSU:       (idx: number) => void;
  selectObject:    (id: string | null) => void;
  setBuildingMode: (v: boolean) => void;

  getCurrentColor: () => string;
  getCurrentCar:   () => string;
  setCurrentCar:   (v: string) => void;
}
