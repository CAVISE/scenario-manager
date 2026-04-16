import { useRef } from 'react';
import * as THREE from 'three';
import { TransformControls } from 'three-stdlib';


export const useEditorSetup = () => {
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const carMeshesRef = useRef<THREE.Mesh[]>([]);
  const carQuaternionsRef = useRef<Map<string, THREE.Quaternion>>(new Map());
  const transformControlsRef = useRef<TransformControls | null>(null);

  const pointsArrRef = useRef<THREE.Mesh[]>([]);
  const pointsObjsRef = useRef<THREE.Mesh[]>([]);
  const cubeCirclesRef = useRef<THREE.Mesh[][]>([]);
  const pedestrianObjsRef = useRef<THREE.Mesh[]>([]);
  const rsuMeshesRef = useRef<THREE.Mesh[]>([]);
  const roadMeshRef = useRef<THREE.Mesh | null>(null);
  const currentCarRef = useRef<string>('');
  const currentColorRef = useRef<string>('00ff00');
  const loadPointsRef = useRef<() => void>(() => {});
  const loadRSURef = useRef<() => void>(() => {});
  const pedestrianMeshesRef = useRef<THREE.Mesh[]>([]);
  const isDraggingRef = useRef(false);
  const ref = useRef<HTMLDivElement>(null);

  const modeRef = useRef({
    isAddCarModeActive: false,
    isAddPointModeActive: false,
    isAddPedestrianModeActive: false,
    isAddedPoints: false,
  });

  return {
    editorRefs: {
      sceneRef,
      cameraRef,
      carMeshesRef,
      carQuaternionsRef,
      transformControlsRef,
      pointsArrRef,
      pointsObjsRef,
      cubeCirclesRef,
      pedestrianObjsRef,
      rsuMeshesRef,
      roadMeshRef,
      currentCarRef,
      currentColorRef,
      loadPointsRef,
      loadRSURef,
      pedestrianMeshesRef,
      isDraggingRef,
      ref,
      modeRef
    }
  };
};