import { useCallback, useRef, type Dispatch, type SetStateAction } from 'react';
import {
  fetchXodrText,
  setStoredXodrName,
} from '@editor/hooks/useThreeScene/hooks/useOdrLoader/utils/xodrRepository';
import { beginMapLoadRequest } from '@editor/lib/mapLoadRequest';
import { getApiErrorMessage } from '@/api/errors';
import { clearLoadedSumoNetwork } from '@scenario-export';
import type { useEditorStore } from '@/store';

type EditorState = ReturnType<typeof useEditorStore.getState>;

interface UseMapSelectionOptions {
  loadFile: (xodr: string, clearMap: boolean) => void;
  updateSimConfigCarla: EditorState['updateSimConfigCarla'];
  updateScenario: EditorState['updateScenario'];
  setSceneExplicitlyCleared: EditorState['setSceneExplicitlyCleared'];
  toastSuccess: (message: string) => void;
  setMapPickerOpen: Dispatch<SetStateAction<boolean>>;
  setMapPickerError: Dispatch<SetStateAction<string | null>>;
  setLoadingMap: Dispatch<SetStateAction<string | null>>;
}

export function useMapSelection({
  loadFile,
  updateSimConfigCarla,
  updateScenario,
  setSceneExplicitlyCleared,
  toastSuccess,
  setMapPickerOpen,
  setMapPickerError,
  setLoadingMap,
}: UseMapSelectionOptions) {
  const requestRef = useRef(0);
  const invalidate = useCallback(() => {
    requestRef.current += 1;
  }, []);

  const handleSelectMap = useCallback(
    async (mapName: string) => {
      const requestId = ++requestRef.current;
      const isCurrentMapLoad = beginMapLoadRequest();
      setMapPickerError(null);
      setLoadingMap(mapName);
      try {
        const xodrText = await fetchXodrText(mapName);
        if (requestId !== requestRef.current || !isCurrentMapLoad()) return;
        setStoredXodrName(mapName);
        updateSimConfigCarla({ map: mapName });
        clearLoadedSumoNetwork();
        loadFile(xodrText, true);
        updateScenario({ id: '' });
        setSceneExplicitlyCleared(true);
        setMapPickerOpen(false);
        toastSuccess(`Map ${mapName} loaded.`);
      } catch (error) {
        if (requestId !== requestRef.current || !isCurrentMapLoad()) return;
        console.error(error);
        const message = await getApiErrorMessage(
          error,
          `Failed to load map ${mapName}.`
        );
        if (requestId !== requestRef.current || !isCurrentMapLoad()) return;
        setMapPickerError(message);
      } finally {
        if (requestId === requestRef.current && isCurrentMapLoad()) {
          setLoadingMap(null);
        }
      }
    },
    [
      loadFile,
      setLoadingMap,
      setMapPickerError,
      setMapPickerOpen,
      setSceneExplicitlyCleared,
      toastSuccess,
      updateScenario,
      updateSimConfigCarla,
    ]
  );

  return { handleSelectMap, invalidate };
}
