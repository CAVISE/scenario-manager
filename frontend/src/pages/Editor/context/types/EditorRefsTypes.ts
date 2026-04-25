import * as THREE from 'three';
import { TransformControls } from 'three-stdlib';
import { RefObject } from 'react';
import { ThreeSetup } from '../../hooks/useOpenDriveUtils/useThreeSetup/types/useThreeSetupTypes';

export interface EditorRefs {
  sceneRef: RefObject<THREE.Scene | undefined>;
  cameraRef: RefObject<THREE.PerspectiveCamera | undefined>;
  carMeshesRef: RefObject<THREE.Mesh[]>;
  carQuaternionsRef: RefObject<Map<string, THREE.Quaternion>>;
  transformControlsRef: RefObject<TransformControls | undefined>;
  pointsArrRef: RefObject<THREE.Mesh[]>;
  pointsObjsRef: RefObject<THREE.Mesh[]>;
  cubeCirclesRef: RefObject<THREE.Mesh[][]>;
  pedestrianObjsRef: RefObject<THREE.Mesh[]>;
  rsuMeshesRef: RefObject<THREE.Mesh[]>;
  roadMeshRef: RefObject<THREE.Mesh | null>;
  currentCarRef: RefObject<string>;
  currentColorRef: RefObject<string>;
  loadPointsRef: RefObject<() => void>;
  loadRSURef: RefObject<() => void>;
  pedestrianMeshesRef: RefObject<THREE.Mesh[]>;
  isDraggingRef: RefObject<boolean>;
  mountRef: RefObject<HTMLDivElement>;
  modeRef: RefObject<{
    isAddCarModeActive: boolean;
    isAddPointModeActive: boolean;
    isAddPedestrianModeActive: boolean;
    isAddedPoints: boolean;
  }>;
  threeRef: React.RefObject<ThreeSetup | null>;
}
