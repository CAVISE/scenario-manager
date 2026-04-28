import React, { useRef } from 'react';
import * as THREE from 'three';
import { TransformControls } from 'three-stdlib';
import { EditorRefsContext } from '../ui/EditorRefsContext';
import { EditorRefs } from '../types/EditorRefsTypes';
import { ThreeSetup } from '../../hooks/useOpenDriveUtils/useThreeSetup/types/useThreeSetupTypes';

export const EditorRefsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const refs: EditorRefs = {
    sceneRef: useRef<THREE.Scene | undefined>(undefined),
    cameraRef: useRef<THREE.PerspectiveCamera | undefined>(undefined),
    carMeshesRef: useRef<THREE.Mesh[]>([]),
    carQuaternionsRef: useRef(new Map<string, THREE.Quaternion>()),
    transformControlsRef: useRef<TransformControls | null>(null),
    pointsArrRef: useRef<THREE.Mesh[]>([]),
    pointsObjsRef: useRef<THREE.Mesh[]>([]),
    cubeCirclesRef: useRef<THREE.Mesh[][]>([]),
    pedestrianObjsRef: useRef<THREE.Mesh[]>([]),
    rsuMeshesRef: useRef<THREE.Mesh[]>([]),
    roadMeshRef: useRef<THREE.Mesh | null>(null),
    currentCarRef: useRef<string>(''),
    currentColorRef: useRef<string>('00ff00'),
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
  };

  return (
    <EditorRefsContext.Provider value={refs}>
      {children}
    </EditorRefsContext.Provider>
  );
};
