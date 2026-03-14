import { useRef, useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { PORT } from "../VARS";
import SpeedDialTooltipOpen from './components/Statuses/Butt.tsx';
import RightPanel           from "./components/Statuses/RightPanel/ui/index";
import { useEditorStore }   from '../store/useEditorStore';
import { Button, Modal, Box, Typography } from '@mui/material';
import TelemetryModal from "../components/TelemetryModal";

import { useTransformMode }  from './Editor/hooks/useTransformMode';
import { useSceneGraph }     from './Editor/hooks/useSceneGraph';
import { useCarModel }       from './Editor/hooks/useCarModel';
import { useCarMeshSync }    from './Editor/hooks/useCarMeshSync';
import { useLidarMeshSync }  from './Editor/hooks/useLidarMeshSync';
import { useRSUMeshSync }    from './Editor/hooks/useRSUMeshSync';
import { useMouseEvents }    from './Editor/hooks/useMouseEvents';
import { useThreeScene }     from './Editor/hooks/useThreeScene';
import { useLoadingState }   from './Editor/hooks/useLoadingState';
import { useBuildingLoader } from './Editor/hooks/useBuildingLoader';
import { useScenarioSave }   from './Editor/hooks/useScenarioSave';

import { CoordinatesWidget }       from './Editor/components/CoordinateWidget.tsx';
import { EditorToolbar }           from './Editor/components/EditorToolbar.tsx';
import { EditorTransformControls } from './Editor/components/EditorTransformControls.tsx';
import { EditorLoadingScreen }     from './Editor/Sceletons/EditorLoadingScreen.tsx';
import { EditorErrorScreen }       from './Editor/Sceletons/EditorErrorScreen.tsx';

import type { SelectedObject } from './Editor/types/editorTypes';
import { TransformControls } from 'three-stdlib';

const Editor = () => {

  const cars                = useEditorStore(s => s.cars);
  const RSUs                = useEditorStore(s => s.RSUs);
  const selectedId          = useEditorStore(s => s.selectedId);
  const isBuildingMode      = useEditorStore(s => s.isBuildingMode);
  const lidars              = useEditorStore(s => s.lidars);
  const addCar              = useEditorStore(s => s.addCar);
  const updateCar           = useEditorStore(s => s.updateCar);
  const selectObject        = useEditorStore(s => s.selectObject);
  const deleteCar           = useEditorStore(s => s.removeCar);
  const addRSU              = useEditorStore(s => s.addRSU);
  const removeRSU           = useEditorStore(s => s.removeRSU);
  const updateRSU           = useEditorStore(s => s.updateRSU);
  const removePointsByCarId = useEditorStore(s => s.removePointsByCarId);
  const addPoint            = useEditorStore(s => s.addPoint);
  const updatePoint         = useEditorStore(s => s.updatePoint);
  const addBuilding         = useEditorStore(s => s.addBuilding);
  const setBuildingMode     = useEditorStore(s => s.setBuildingMode);

  const sceneRef             = useRef<THREE.Scene>();
  const cameraRef            = useRef<THREE.PerspectiveCamera>();
  const carMeshesRef         = useRef<THREE.Mesh[]>([]);
  const carQuaternionsRef    = useRef<Map<string, THREE.Quaternion>>(new Map());
  const transformControlsRef = useRef<TransformControls | null>(null);

  const pointsArrRef    = useRef<THREE.Mesh[]>([]);
  const pointsObjsRef   = useRef<THREE.Mesh[]>([]);
  const cubeCirclesRef  = useRef<THREE.Mesh[][]>([]);
  const roadMeshRef     = useRef<THREE.Mesh | null>(null);
  const currentCarRef   = useRef<string>('');
  const currentColorRef = useRef<string>('00ff00');
  const loadPointsRef   = useRef<() => void>(() => {});

  const modeRef = useRef({
    isAddCarModeActive:   false,
    isAddPointModeActive: false,
    isAddedPoints:        false,
  });

  const [selectedObject,        setSelectedObject]        = useState<SelectedObject | null>(null);
  const [telemetryModalOpen,    setTelemetryModalOpen]    = useState(false);
  const [simulationConfirmOpen, setSimulationConfirmOpen] = useState(false);
  const [error,                 setError]                 = useState<Error | null>(null);

  const { loadingText, loadingProgress, setStep } = useLoadingState();
  const buildingModelRef                          = useBuildingLoader();
  const { transformMode, handleSetMode }          = useTransformMode(transformControlsRef);
  const { sceneGraph, updateSceneGraph }          = useSceneGraph(sceneRef);
  const { carModelRef }                           = useCarModel();
  const handleSaveScenario                        = useScenarioSave();

  useEffect(() => {
    if (isBuildingMode) transformControlsRef.current?.detach();
  }, [isBuildingMode]);

  useCarMeshSync({
    cars, selectedId, sceneRef, carModelRef,
    carMeshesRef, carQuaternionsRef, transformControlsRef,
    updateSceneGraph
  });

  useLidarMeshSync({
    lidars, cars, carMeshesRef, transformControlsRef,
    onSelect: (lidarId) => setSelectedObject({ type: 'lidar', id: lidarId }),
    updateSceneGraph
  });

  // Автоматически синхронизирует меши RSU при изменении стора
  useRSUMeshSync({
    RSUs,
    sceneRef,
    pointsArrRef,
    pointsObjsRef,
    transformControlsRef,
    updateSceneGraph
  });

  const { actionsRef } = useThreeScene({
    sceneRef, cameraRef, transformControlsRef,
    carMeshesRef, carQuaternionsRef,
    pointsArrRef, pointsObjsRef, cubeCirclesRef, roadMeshRef,
    currentCarRef, currentColorRef, loadPointsRef,
    modeRef, buildingModelRef,
    setStep, updateSceneGraph, setSelectedObject,
    addCar, updateCar, deleteCar, selectObject,
    addRSU, updateRSU, removePointsByCarId,
    addPoint, updatePoint, addBuilding, setBuildingMode,
    setError,
  });

  useMouseEvents({
    getScene:             () => sceneRef.current,
    getCamera:            () => cameraRef.current,
    getTransformControls: () => transformControlsRef.current,
    getCarMeshes:         () => carMeshesRef.current,
    getPointsArr:         () => pointsArrRef.current,
    getPointsObjs:        () => pointsObjsRef.current,
    getCubeCircles:       () => cubeCirclesRef.current,
    getRoadMesh:          () => roadMeshRef.current,
    modeRef,
    buildingModelRef,
    onSelectObject:   setSelectedObject,
    onDetachControls: () => { transformControlsRef.current?.detach(); selectObject(null); },
    onDeleteCube:     () => actionsRef.current.deleteCube(),
    onLoadPoints:     () => loadPointsRef.current(),
    addCar, addRSU, addPoint, addBuilding,
    updateCar, updatePoint, updateRSU, removeRSU,
    selectObject, setBuildingMode,
    getCurrentColor: () => currentColorRef.current,
    getCurrentCar:   () => currentCarRef.current,
    setCurrentCar:   (v) => { currentCarRef.current = v; },
    updateSceneGraph
  });

  const handleAddCube   = useCallback(() => { currentCarRef.current = ''; actionsRef.current.addCube(); }, []);
  const handleAddRSU    = useCallback(() => { actionsRef.current.addRSU(); }, []);
  const handleDeleteCar = useCallback(() => { actionsRef.current.deleteCube(); }, []);
  const handleAddPoints = useCallback(() => { actionsRef.current.addPoints(); }, []);

  const detachTransformControls = () => { transformControlsRef.current?.detach(); selectObject(null); };

  const handleStartSimulation = () => {
    const payload = {
      scenario_id: "9959781287", scenario_name: "сценарий 1", weather: "HardRainNoon",
      scenario: [{ path: [{x:-35,y:138,z:0.3},{x:35,y:10,z:0.3}], vehicle: "mercedes.coupe_2020", color: {r:127,g:0,b:0}, active: false }],
    };
    fetch(`http://localhost:${PORT}/api/start_opencda`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); })
      .catch(err => { console.error(err); alert('Не удалось запустить симуляцию.'); });
    setSimulationConfirmOpen(false);
  };
  
  return (
    <div className='scenario-manager__editor'>
        <EditorLoadingScreen text={loadingText} progress={loadingProgress} />
        <EditorErrorScreen
          title={error ? 'Runtime Error' : null}
          message={error?.message}
          onRetry={() => { setError(null); window.location.reload(); }}
          onDismiss={() => setError(null)}
        />
        <div id="ThreeJS" style={{ position: 'absolute', inset: 0 }} />
      <EditorToolbar
        onOpenFile={() => window.PARAMS?.load_file?.()}
        onSave={handleSaveScenario}
        onOpenSimulationConfirm={() => setSimulationConfirmOpen(true)}
        onOpenTelemetryModal={() => setTelemetryModalOpen(true)}
      />
      <EditorTransformControls transformMode={transformMode} onSetMode={handleSetMode} />

      <RightPanel
        sceneGraph={sceneGraph}
        onDetach={detachTransformControls}
        onDeleteCar={handleDeleteCar}
        onDeleteCube={() => actionsRef.current.deleteCar?.()}
        selectedObject={selectedObject}
        onDeleteSelected={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }))}
        sceneRef={sceneRef}
        transformControlsRef={transformControlsRef}
        onSelectObject={setSelectedObject}
        pointsArrRef={pointsArrRef} 
        carMeshesRef={carMeshesRef}
      />

      <SpeedDialTooltipOpen
        onAddCar={handleAddCube}
        onAddRSU={handleAddRSU}
        onAddpoints={handleAddPoints}
        onDeleteCar={handleDeleteCar}
        onAddBuilding={() => {
        modeRef.current.isAddPointModeActive = false;  
        modeRef.current.isAddCarModeActive   = false;
        modeRef.current.isAddedPoints = false
        setBuildingMode(true);
      }}
      />

      <TelemetryModal open={telemetryModalOpen} onClose={() => setTelemetryModalOpen(false)} />

      <CoordinatesWidget
        getCameraRef={() => cameraRef.current}
        getRoadMesh={() => roadMeshRef.current}
      />

      <Modal open={simulationConfirmOpen} onClose={() => setSimulationConfirmOpen(false)}>
        <Box sx={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:400, bgcolor:'background.paper', border:'1px solid #ccc', boxShadow:24, p:4, textAlign:'center' }}>
          <Typography variant="h6" gutterBottom>Confirmation</Typography>
          <Typography sx={{ mt:2, mb:3 }}>Are you sure you want to run the simulation?</Typography>
          <Button variant="contained" onClick={handleStartSimulation} sx={{ bgcolor:'error.main', '&:hover':{bgcolor:'error.dark'} }}>Run</Button>
        </Box>
      </Modal>
    </div>
  );
};

export default Editor;