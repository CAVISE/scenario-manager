import { useEditorStore } from "../../../store/useEditorStore";
import { OpenDriveModule } from "../hooks/types/useOdrMapTypes";
import { PARAMS } from "../hooks/types/useThreeSceneTypes";
import { LOADING_STEPS, OpenDriveMapInstance } from "../types/editorTypes";

export function reloadOdrMap({ setStep, setError, ModuleOpenDrive, OpenDriveMap, loadOdrMap }:
     {
        ModuleOpenDrive: OpenDriveModule | null,
        setError: (error: Error)=>void; 
        setStep: (step: keyof typeof LOADING_STEPS) => void;
        OpenDriveMap: OpenDriveMapInstance | null
        loadOdrMap: (clear_map: boolean, fit_view: boolean) => void
    }) {
      if (!ModuleOpenDrive) {
        setStep('done');
        setError?.(new Error('OpenDRIVE module not initialized'));
        return;
      }
      try {
        if (OpenDriveMap) OpenDriveMap.delete();
        OpenDriveMap = new ModuleOpenDrive.OpenDriveMap("./data.xodr", {
          with_lateralProfile: PARAMS.lateralProfile, with_laneHeight: PARAMS.laneHeight,
          with_road_objects: false, center_map: true, abs_z_for_for_local_road_obj_outline: true,
        });
        loadOdrMap(true, false);
      } catch (err) {
        console.error(err);
        setStep('done');
        setError?.(err instanceof Error ? err : new Error('Failed to reload the map'));
      }
    }
export function loadFile({file_text, clear_map, ModuleOpenDrive, setStep, setError, OpenDriveMap, loadOdrMap}:{
    file_text: string, 
    clear_map: boolean
    ModuleOpenDrive: OpenDriveModule | null,
    setStep: (step: keyof typeof LOADING_STEPS) => void;
    setError: (err: Error) => void
    OpenDriveMap: OpenDriveMapInstance | null
    loadOdrMap: (clear_map: boolean) => void
}) {
      if (!ModuleOpenDrive) {
        setStep('done');
        setError?.(new Error('OpenDRIVE module not initialized'));
        return;
      }
      if (clear_map) {
        localStorage.setItem('cached_xodr', file_text);
        const s = useEditorStore.getState();
        s.cars.forEach(c => s.removeCar(c.id));
        while (useEditorStore.getState().RSUs.length > 0) useEditorStore.getState().removeRSU(0);
        s.points.forEach(p => s.removePoint(p.id));
        s.buildings.forEach(b => s.removeBuilding(b.id));
        setTimeout(() => localStorage.removeItem('editor-scenario-cache'), 100);
        try { ModuleOpenDrive.FS_unlink('./data.xodr'); } catch (err) {
          console.error(err);
          setStep('done');
          setError?.(err instanceof Error ? err : new Error('Failed to process map file'));
        }
      }
      try {
        ModuleOpenDrive.FS_createDataFile(".", "data.xodr", file_text, true, true);
        if (OpenDriveMap) OpenDriveMap.delete();
        OpenDriveMap = new ModuleOpenDrive.OpenDriveMap("./data.xodr", {
          with_lateralProfile: PARAMS.lateralProfile, with_laneHeight: PARAMS.laneHeight,
          with_road_objects: false, center_map: true, abs_z_for_for_local_road_obj_outline: true,
        });
        setStep('scene');
        loadOdrMap(clear_map);
      } catch (err) {
        console.error(err);
        setStep('done');
        setError?.(err instanceof Error ? err : new Error('Failed to process map file'));
      }
    }