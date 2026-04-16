import SpeedDialTooltipOpen from './components/Statuses/Butt.tsx';
import RightPanel           from "./components/Statuses/RightPanel/ui/index";

import { useSceneGraph }     from './Editor/hooks/useSceneGraph';
import { useCarMeshSync }        from './Editor/hooks/useCarMeshSync';
import { useLidarMeshSync }      from './Editor/hooks/useLidarMeshSync';
import { useRSUMeshSync }        from './Editor/hooks/useRSUMeshSync';
import { usePedestrianMeshSync } from './Editor/hooks/usePedestrianMeshSync';
import { useMouseEvents }        from './Editor/hooks/useMouseEvents';
import { useThreeScene }     from './Editor/hooks/useThreeScene';
import { useLoadingState }   from './Editor/hooks/useLoadingState';
import { useBuildingLoader } from './Editor/hooks/useBuildingLoader';
import { useEditorHandlers } from './Editor/hooks/useEditorHandlers';

import { CoordinatesWidget }       from './Editor/components/CoordinateWidget/CoordinateWidget.tsx';
import { EditorToolbar }           from './Editor/components/EditorToolbar/EditorToolbar.tsx';
import { EditorTransformControls } from './Editor/components/EditorTransformControls/EditorTransformControls.tsx';
import { EditorLoadingScreen }     from './Editor/Sceletons/EditorLoadingScreen.tsx';
import { EditorErrorScreen }       from './Editor/Sceletons/EditorErrorScreen.tsx';
import { EditorModals }            from './Editor/components/EditorModals.tsx';

import { useEditorRefs } from './Editor/context/EditorRefsContext.ts';
import { useEffect } from 'react';
import { useEditorStore } from '../store/useEditorStore.ts';

const Editor = () => {

  const { sceneRef, transformControlsRef, currentCarRef, modeRef, mountRef } = useEditorRefs();

  

  const { loadingText, loadingProgress, setStep } = useLoadingState();
  const buildingModelRef                          = useBuildingLoader();
  const { sceneGraph, updateSceneGraph }          = useSceneGraph(sceneRef);
  const setError = useEditorStore(s=>s.setError)

  useCarMeshSync({ updateSceneGraph });
  usePedestrianMeshSync({ updateSceneGraph });
  useLidarMeshSync({ updateSceneGraph });
  useRSUMeshSync({ updateSceneGraph });

  const { actionsRef } = useThreeScene({ buildingModelRef, setStep, updateSceneGraph});

  useMouseEvents({
    buildingModelRef,
    onDeleteCube: () => actionsRef.current.deleteCube(),
    updateSceneGraph
   });

  const { handleAddCube, handleAddRSU, handleAddPedestrian, handleDeleteCar, handleAddPoints, detachTransformControls, handleSetBuildingMode } = useEditorHandlers({ actionsRef, currentCarRef, modeRef, transformControlsRef});

  useEffect(() => {
    if (!mountRef.current) {
      setError(new Error("ThreeJS mount point not found"));
      return;
    }
  }, []);

  return (
    <div className='scenario-manager__editor'>
        <EditorLoadingScreen text={loadingText} progress={loadingProgress} />
        <EditorErrorScreen/>
      <div ref={mountRef} id="ThreeJS" style={{ position: 'absolute', inset: 0 }} />
      <EditorToolbar
        buildingModelRef={buildingModelRef}
        updateSceneGraph={updateSceneGraph}
      />
      <EditorTransformControls/>

      <RightPanel
        sceneGraph={sceneGraph}
        onDetach={detachTransformControls}
        onDeleteCar={handleDeleteCar}     
        updateSceneGraph={updateSceneGraph}
      />
      
      <SpeedDialTooltipOpen
        onAddCar={handleAddCube}
        onAddRSU={handleAddRSU}
        onAddPedestrian={handleAddPedestrian}
        onAddpoints={handleAddPoints}
        onAddBuilding={handleSetBuildingMode}
      />

      <CoordinatesWidget/>

      <EditorModals />
    </div>
  );
};

export default Editor;