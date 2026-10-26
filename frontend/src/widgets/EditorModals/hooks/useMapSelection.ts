import { useCallback, useRef, type Dispatch, type SetStateAction } from 'react';
import { fetchXodrText } from '@editor/hooks/useThreeScene/hooks/useOdrLoader/utils/xodrRepository';
import { beginMapLoadRequest } from '@editor/lib/mapLoadRequest';
import { getApiErrorMessage } from '@/api/errors';
import { clearLoadedSumoNetwork } from '@scenario-export';
import { invalidatePreviewCache } from '@right-panel/components/ScenarioControlWidget/Handlers/utils/scenarioPreview';
import { useEditorStore } from '@/store';

type EditorState = ReturnType<typeof useEditorStore.getState>;

interface UseMapSelectionOptions {
  loadFile: (
    xodr: string,
    clearMap: boolean,
    sourceName?: string
  ) => Promise<boolean>;
  updateSimConfigCarla: EditorState['updateSimConfigCarla'];
  updateScenario: EditorState['updateScenario'];
  setSceneExplicitlyCleared: EditorState['setSceneExplicitlyCleared'];
  setMapLoading: EditorState['setMapLoading'];
  markScenarioClean: EditorState['markScenarioClean'];
  toastSuccess: (message: string) => void;
  setMapPickerOpen: Dispatch<SetStateAction<boolean>>;
  setMapPickerError: Dispatch<SetStateAction<string | null>>;
  setLoadingMap: Dispatch<SetStateAction<string | null>>;
  cancelMapLoad: () => void;
}

export function useMapSelection({
  loadFile,
  updateSimConfigCarla,
  updateScenario,
  setSceneExplicitlyCleared,
  setMapLoading,
  markScenarioClean,
  toastSuccess,
  setMapPickerOpen,
  setMapPickerError,
  setLoadingMap,
  cancelMapLoad,
}: UseMapSelectionOptions) {
  const requestRef = useRef(0);
  const invalidate = useCallback(() => {
    requestRef.current += 1;
    cancelMapLoad();
    setMapLoading(false);
  }, [cancelMapLoad, setMapLoading]);

  const handleSelectMap = useCallback(
    async (mapName: string): Promise<boolean> => {
      const requestId = ++requestRef.current;
      cancelMapLoad();
      beginMapLoadRequest();
      setMapLoading(true);
      setMapPickerError(null);
      setLoadingMap(mapName);
      setMapPickerOpen(false);
      try {
        const xodrText = await fetchXodrText(mapName);
        if (requestId !== requestRef.current) return false;
        clearLoadedSumoNetwork();
        if ((await loadFile(xodrText, true, mapName)) === false) {
          throw new Error(`Failed to load map ${mapName}.`);
        }
        if (requestId !== requestRef.current) return false;
        updateSimConfigCarla({ map: mapName });
        updateScenario({
          id: '',
          revision: undefined,
          name: '',
          description: '',
          file_: null,
        });
        invalidatePreviewCache();
        setSceneExplicitlyCleared(false);
        useEditorStore.getState().clearHistory();
        useEditorStore.getState().clearDeletionHistory();
        markScenarioClean();
        toastSuccess(`Map ${mapName} loaded.`);
        return true;
      } catch (error) {
        if (requestId !== requestRef.current) return false;
        console.error(error);
        const message = await getApiErrorMessage(
          error,
          `Failed to load map ${mapName}.`
        );
        if (requestId !== requestRef.current) return false;
        setMapPickerError(message);
        setMapPickerOpen(true);
        return false;
      } finally {
        if (requestId === requestRef.current) {
          setLoadingMap(null);
          setMapLoading(false);
        }
      }
    },
    [
      loadFile,
      setLoadingMap,
      setMapPickerError,
      setMapPickerOpen,
      setMapLoading,
      markScenarioClean,
      setSceneExplicitlyCleared,
      toastSuccess,
      updateScenario,
      updateSimConfigCarla,
      cancelMapLoad,
    ]
  );

  return { handleSelectMap, invalidate };
}
