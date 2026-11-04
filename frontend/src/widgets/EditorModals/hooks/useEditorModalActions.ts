import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { useEditorStore } from '@/store';

type UseEditorModalActionsOptions = {
  setTelemetryOpen: Dispatch<SetStateAction<boolean>>;
  setSimulationOpen: Dispatch<SetStateAction<boolean>>;
  setMapPickerOpen: Dispatch<SetStateAction<boolean>>;
  selectMap: (mapName: string, onSuccess?: () => void) => Promise<void>;
};

export function useEditorModalActions({
  setTelemetryOpen,
  setSimulationOpen,
  setMapPickerOpen,
  selectMap,
}: UseEditorModalActionsOptions) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.editorModals = {
      openTelemetry: () => setTelemetryOpen(true),
      openSimulation: () => setSimulationOpen(true),
      openMapPicker: () => setMapPickerOpen(true),
      selectMap: (mapName, onSuccess) => {
        if (mapName === useEditorStore.getState().simConfig.carla.map) return;
        if (onSuccess) {
          void selectMap(mapName, onSuccess);
          return;
        }
        void selectMap(mapName);
      },
    };
    return () => {
      delete (window as Window).editorModals;
    };
  }, [selectMap, setMapPickerOpen, setSimulationOpen, setTelemetryOpen]);
}
