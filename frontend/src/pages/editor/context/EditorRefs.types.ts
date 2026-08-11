import * as THREE from 'three';
import { TransformControls } from 'three-stdlib';
import type { MutableRefObject } from 'react';
import { ThreeSetup } from '../hooks/useThreeSetup.types';
import { OpenDriveMapInstance } from '../editor.types';

export interface EditorRefs {
  sceneRef: MutableRefObject<THREE.Scene | undefined>;
  cameraRef: MutableRefObject<THREE.PerspectiveCamera | undefined>;
  carMeshesRef: MutableRefObject<THREE.Mesh[]>;
  carQuaternionsRef: MutableRefObject<Map<string, THREE.Quaternion>>;
  transformControlsRef: MutableRefObject<TransformControls | null>;
  pointsArrRef: MutableRefObject<THREE.Mesh[]>;
  pointsObjsRef: MutableRefObject<THREE.Mesh[]>;
  cubeCirclesRef: MutableRefObject<THREE.Mesh[][]>;
  pedestrianObjsRef: MutableRefObject<THREE.Mesh[]>;
  rsuMeshesRef: MutableRefObject<THREE.Mesh[]>;
  buildingMeshesRef: MutableRefObject<THREE.Object3D[]>;
  roadMeshRef: MutableRefObject<THREE.Mesh | null>;
  currentCarRef: MutableRefObject<string>;
  currentColorRef: MutableRefObject<string>;
  loadPointsRef: MutableRefObject<() => void>;
  loadRSURef: MutableRefObject<() => void>;
  pedestrianMeshesRef: MutableRefObject<THREE.Mesh[]>;
  isDraggingRef: MutableRefObject<boolean>;
  mountRef: MutableRefObject<HTMLDivElement | null>;
  modeRef: MutableRefObject<{
    isAddCarModeActive: boolean;
    isAddPointModeActive: boolean;
    isAddPedestrianModeActive: boolean;
    isAddedPoints: boolean;
  }>;
  threeRef: MutableRefObject<ThreeSetup | null>;
  odrMapRef: MutableRefObject<OpenDriveMapInstance | null>;
  modalOpenCountRef: MutableRefObject<number>;
}
