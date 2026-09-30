import { useRef } from 'react';
import * as THREE from 'three';
import { TransformControls } from 'three-stdlib';
import { EditorRefsContext } from './EditorRefsContext';
import { ThreeSetup } from '../../hooks/useOpenDriveUtils/useThreeSetup/types/useThreeSetupTypes';
import { DEFAULT_COLOR } from '../../hooks/useThreeScene/constants/openDriveConstants';
import { OpenDriveMapInstance } from '../../types/editorTypes';
import { EditorRefs } from '../types/EditorRefsTypes';
import type { EditorProviderProps } from '../types/providerTypes';

export const EditorRefsProvider = ({ children }: EditorProviderProps) => {
  const refs: EditorRefs = {
    sceneRef: useRef<THREE.Scene | undefined>(undefined),
    cameraRef: useRef<THREE.PerspectiveCamera | undefined>(undefined),
    carMeshesRef: useRef<THREE.Mesh[]>([]),
    carQuaternionsRef: useRef(new Map<string, THREE.Quaternion>()),
    transformControlsRef: useRef<TransformControls | null>(null),
    rsuRenderMeshesRef: useRef<THREE.Mesh[]>([]),
    rsuObjectMeshesRef: useRef<THREE.Mesh[]>([]),
    routePointMeshesRef: useRef<THREE.Mesh[][]>([]),
    pedestrianObjsRef: useRef<THREE.Mesh[]>([]),
    rsuMeshesRef: useRef<THREE.Mesh[]>([]),
    buildingMeshesRef: useRef<THREE.Object3D[]>([]),
    roadMeshRef: useRef<THREE.Mesh | null>(null),
    currentCarRef: useRef<string>(''),
    currentColorRef: useRef<string>(DEFAULT_COLOR),
    loadPointsRef: useRef<() => void>(() => {}),
    loadRSURef: useRef<() => void>(() => {}),
    pedestrianMeshesRef: useRef<THREE.Mesh[]>([]),
    isDraggingRef: useRef(false),
    mountRef: useRef<HTMLDivElement | null>(null),
    modeRef: useRef({
      isAddCarModeActive: false,
      isAddPointModeActive: false,
      isAddPedestrianModeActive: false,
      isAddedPoints: false,
    }),
    threeRef: useRef<ThreeSetup | null>(null),
    odrMapRef: useRef<OpenDriveMapInstance | null>(null),
  };

  return (
    <EditorRefsContext.Provider value={refs}>
      {children}
    </EditorRefsContext.Provider>
  );
};
