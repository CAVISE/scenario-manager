import React, { useRef } from 'react';
import * as THREE from 'three';
import { TransformControls } from 'three-stdlib';
import { ThreeSceneContext } from './ThreeSceneContext';
import type { ThreeSceneRefs } from './ThreeSceneTypes';
import { useBuildingLoader } from '../pages/Editor/hooks/useBuildingLoader';
import { useEditorStore } from '../store/useEditorStore';
import type { SelectedObject } from '../pages/Editor/types/editorTypes';

interface Props {
  children: React.ReactNode;
  updateSceneGraph?: () => void;
  setSelectedObject?: (obj: SelectedObject | null) => void;
}

const ThreeSceneProvider: React.FC<Props> = ({ children, updateSceneGraph, setSelectedObject }) => {
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

  const modeRef = useRef({
    isAddCarModeActive: false,
    isAddPointModeActive: false,
    isAddPedestrianModeActive: false,
    isAddedPoints: false,
  });

  const buildingModelRef = useBuildingLoader();

  // Get all store functions
  const addCar = useEditorStore(s => s.addCar);
  const updateCar = useEditorStore(s => s.updateCar);
  const removeCar = useEditorStore(s => s.removeCar);
  const selectObject = useEditorStore(s => s.selectObject);
  const addRSU = useEditorStore(s => s.addRSU);
  const removeRSU = useEditorStore(s => s.removeRSU);
  const updateRSU = useEditorStore(s => s.updateRSU);
  const addLidar = useEditorStore(s => s.addLidar);
  const updateLidar = useEditorStore(s => s.updateLidar);
  const removeLidar = useEditorStore(s => s.removeLidar);
  const removeLidarsByCarId = useEditorStore(s => s.removeLidarsByCarId);
  const addPoint = useEditorStore(s => s.addPoint);
  const removePoint = useEditorStore(s => s.removePoint);
  const removePointsByCarId = useEditorStore(s => s.removePointsByCarId);
  const updatePoint = useEditorStore(s => s.updatePoint);
  const addBuilding = useEditorStore(s => s.addBuilding);
  const updateBuilding = useEditorStore(s => s.updateBuilding);
  const removeBuilding = useEditorStore(s => s.removeBuilding);
  const addPedestrian = useEditorStore(s => s.addPedestrian);
  const updatePedestrian = useEditorStore(s => s.updatePedestrian);
  const removePedestrian = useEditorStore(s => s.removePedestrian);
  const setBuildingMode = useEditorStore(s => s.setBuildingMode);
  const removeSelectedId = useEditorStore(s => s.removeSelectedId);

  const refsValue: ThreeSceneRefs = {
    sceneRef,
    cameraRef,
    transformControlsRef,
    carMeshesRef,
    carQuaternionsRef,
    pointsArrRef,
    pointsObjsRef,
    cubeCirclesRef,
    pedestrianObjsRef,
    rsuMeshesRef,
    roadMeshRef,
    pedestrianMeshesRef,
    currentCarRef,
    currentColorRef,
    isDraggingRef,
    loadPointsRef,
    loadRSURef,
    modeRef,
    buildingModelRef,
    addCar,
    updateCar,
    removeCar,
    selectObject,
    addRSU,
    removeRSU,
    updateRSU,
    addLidar,
    updateLidar,
    removeLidar,
    removeLidarsByCarId,
    addPoint,
    removePoint,
    removePointsByCarId,
    updatePoint,
    addBuilding,
    updateBuilding,
    removeBuilding,
    addPedestrian,
    updatePedestrian,
    removePedestrian,
    setBuildingMode,
    removeSelectedId,
    updateSceneGraph: updateSceneGraph || (() => {}),
    setSelectedObject: setSelectedObject || (() => {})
  };

  return (
    <ThreeSceneContext.Provider value={refsValue}>
      {children}
    </ThreeSceneContext.Provider>
  );
};

export default ThreeSceneProvider;