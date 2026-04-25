import { useBuildingLoader } from '../../hooks/useEditorScene/hooks/buildingFunction';
import { useEditorHandlers } from '../../hooks/useEditorEngine/useEditorHandlers';
import { useLoadingState } from '../../hooks/useEditorEngine/useLoadingState';
import { useSceneGraph } from '../../hooks/useEditorEngine/useSceneGraph';
import { useThreeScene } from '../../hooks/useThreeScene';
import { useEditorRefs } from './EditorRefsContext';
import { HooksContext } from './hooksContext';

export const HooksProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { sceneRef, currentCarRef, modeRef, transformControlsRef } =
    useEditorRefs();

  const buildingModelRef = useBuildingLoader();
  const { sceneGraph, updateSceneGraph } = useSceneGraph(sceneRef);
  const { loadingText, loadingProgress, setStep } = useLoadingState();
  const { actionsRef } = useThreeScene({
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
    handleAddCube,
    handleAddRSU,
    handleAddPedestrian,
    handleAddPoints,
    detachTransformControls,
    handleSetBuildingMode,
  };

  return (
    <HooksContext.Provider value={value}>{children}</HooksContext.Provider>
  );
};
