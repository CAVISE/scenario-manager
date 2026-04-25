import * as THREE from 'three';
import { TransformControls } from 'three-stdlib';
import { RefObject, MutableRefObject } from 'react';
import { ThreeSetup } from '../../hooks/useOpenDriveUtils/useThreeSetup/types/useThreeSetupTypes';

export interface EditorRefs {
  sceneRef: MutableRefObject<THREE.Scene | undefined>;
  cameraRef: MutableRefObject<THREE.PerspectiveCamera | undefined>;
  carMeshesRef: MutableRefObject<THREE.Mesh[]>;
  carQuaternionsRef: MutableRefObject<Map<string, THREE.Quaternion>>;
  transformControlsRef: MutableRefObject<TransformControls | undefined>;
  pointsArrRef: MutableRefObject<THREE.Mesh[]>;
  pointsObjsRef: MutableRefObject<THREE.Mesh[]>;
  cubeCirclesRef: MutableRefObject<THREE.Mesh[][]>;
  pedestrianObjsRef: MutableRefObject<THREE.Mesh[]>;
  rsuMeshesRef: MutableRefObject<THREE.Mesh[]>;
  roadMeshRef: MutableRefObject<THREE.Mesh | null>;
  currentCarRef: MutableRefObject<string>;
  currentColorRef: MutableRefObject<string>;
  loadPointsRef: MutableRefObject<() => void>;
  loadRSURef: MutableRefObject<() => void>;
  pedestrianMeshesRef: MutableRefObject<THREE.Mesh[]>;
  isDraggingRef: MutableRefObject<boolean>;
  mountRef: RefObject<HTMLDivElement>;
  modeRef: MutableRefObject<{
    isAddCarModeActive: boolean;
    isAddPointModeActive: boolean;
    isAddPedestrianModeActive: boolean;
    isAddedPoints: boolean;
  }>;
  threeRef: React.MutableRefObject<ThreeSetup | null>;
}
