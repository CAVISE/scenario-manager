import { useBuildingLoader } from '../hooks/useEditorScene/buildingLoader';
import { useEditorHandlers } from '../hooks/useEditorHandlers';
import { useLoadingState } from '../hooks/useLoadingState';
import { useSceneGraph } from '../hooks/useSceneGraph';
import { useThreeScene } from '../hooks/useThreeScene';
import { useEditorRefs } from './EditorRefsContext';
import { HooksContext } from './HooksContext';
import { useEffect } from 'react';

export const HooksProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { sceneRef, currentCarRef, modeRef, transformControlsRef } =
    useEditorRefs();

  const buildingModelRef = useBuildingLoader();
  const { sceneGraph, updateSceneGraph } = useSceneGraph(sceneRef);
  const { loadingText, loadingProgress, setStep } = useLoadingState();
  const { actionsRef, loadFile } = useThreeScene({
    updateSceneGraph,
    setStep,
    buildingModelRef,
  });
  const {
    handleAddCube,
    handleAddRSU,
    handleAddPedestrian,
    handleAddPoints,
    detachTransformControls,
    handleSetBuildingMode,
  } = useEditorHandlers({
    actionsRef,
    currentCarRef,
    modeRef,
    transformControlsRef,
  });
  const value = {
    buildingModelRef,
    sceneGraph,
    updateSceneGraph,
    loadingProgress,
    loadingText,
    setStep,
    actionsRef,
    loadFile,
    handleAddCube,
    handleAddRSU,
    handleAddPedestrian,
    handleAddPoints,
    detachTransformControls,
    handleSetBuildingMode,
  };
  useEffect(() => {
    console.log('[Loading] text:', loadingText, 'progress:', loadingProgress);
  }, [loadingText, loadingProgress]);
  return (
    <HooksContext.Provider value={value}>{children}</HooksContext.Provider>
  );
};
