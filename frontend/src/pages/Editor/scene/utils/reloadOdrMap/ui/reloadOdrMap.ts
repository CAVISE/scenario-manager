import { OpenDriveModule } from '@editor/hooks/useOpenDriveUtils/useOdrMap/types/useOdrMapTypes';
import { MAP_PATH } from '@editor/hooks/useThreeScene/hooks/useOdrLoader/types/useOdrLoaderTypes';
import {
  setCachedCustomXodrContent,
  DEFAULT_XODR,
} from '@editor/hooks/useThreeScene/hooks/useOdrLoader/utils/xodrRepository';
import { PARAMS } from '@editor/hooks/useThreeScene/types/useThreeSceneTypes';
import { LOADING_STEPS, OpenDriveMapInstance } from '@editor/types/editorTypes';
import { useEditorStore } from '@/store';

export function reloadOdrMap({
  setStep,
  setError,
  ModuleOpenDrive,
  OpenDriveMap,
  loadOdrMap,
}: {
  ModuleOpenDrive: OpenDriveModule | null;
  setError: (error: Error) => void;
  setStep: (step: keyof typeof LOADING_STEPS) => void;
  OpenDriveMap: OpenDriveMapInstance | null;
  loadOdrMap: (clear_map: boolean, fit_view: boolean) => void;
}) {
  if (!ModuleOpenDrive) {
    setStep('done');
    setError?.(new Error('OpenDRIVE module not initialized'));
    return;
  }
  try {
    if (OpenDriveMap) OpenDriveMap.delete();
    OpenDriveMap = new ModuleOpenDrive.OpenDriveMap(MAP_PATH, {
      with_lateralProfile: PARAMS.lateralProfile,
      with_laneHeight: PARAMS.laneHeight,
      with_road_objects: false,
      center_map: false,
      abs_z_for_for_local_road_obj_outline: true,
    });
    loadOdrMap(true, false);
    console.log('[OpenDRIVE] center_map = false');
    console.log('[OpenDRIVE] x_offs =', OpenDriveMap.x_offs);
    console.log('[OpenDRIVE] y_offs =', OpenDriveMap.y_offs);
  } catch (err) {
    console.error(err);
    setStep('done');
    setError?.(
      err instanceof Error ? err : new Error('Failed to reload the map')
    );
  }
}
export function loadFile({
  file_text,
  clear_map,
  ModuleOpenDrive,
  setStep,
  setError,
  OpenDriveMap,
  loadOdrMap,
}: {
  file_text: string;
  clear_map: boolean;
  ModuleOpenDrive: OpenDriveModule | null;
  setStep: (step: keyof typeof LOADING_STEPS) => void;
  setError: (err: Error) => void;
  OpenDriveMap: OpenDriveMapInstance | null;
  loadOdrMap: (clear_map: boolean) => void;
}) {
  if (!ModuleOpenDrive) {
    setStep('done');
    setError?.(new Error('OpenDRIVE module not initialized'));
    return;
  }
  if (clear_map) {
    setCachedCustomXodrContent(file_text);
    const s = useEditorStore.getState();
    s.cars.forEach((c) => s.removeCar(c.id));
    while (useEditorStore.getState().RSUs.length > 0)
      useEditorStore.getState().removeRSU(0);
    s.points.forEach((p) => s.removePoint(p.id));
    s.buildings.forEach((b) => s.removeBuilding(b.id));
    s.removeSelectedId();
    useEditorStore.persist.clearStorage();
    try {
      ModuleOpenDrive.FS_unlink(MAP_PATH);
    } catch (err) {
      console.error(err);
      setStep('done');
      setError?.(
        err instanceof Error ? err : new Error('Failed to process map file')
      );
    }
  }
  try {
    ModuleOpenDrive.FS_createDataFile('.', DEFAULT_XODR, file_text, true, true);
    if (OpenDriveMap) OpenDriveMap.delete();
    console.log('JFAOSJHFHSAF(HFHASF');
    OpenDriveMap = new ModuleOpenDrive.OpenDriveMap(MAP_PATH, {
      with_lateralProfile: PARAMS.lateralProfile,
      with_laneHeight: PARAMS.laneHeight,
      with_road_objects: false,
      center_map: false,
      abs_z_for_for_local_road_obj_outline: false,
    });
    setStep('scene');
    loadOdrMap(clear_map);
    console.log('[OpenDRIVE] center_map = false');
    console.log('[OpenDRIVE] x_offs =', OpenDriveMap.x_offs);
    console.log('[OpenDRIVE] y_offs =', OpenDriveMap.y_offs);
  } catch (err) {
    console.error(err);
    setStep('done');
    setError?.(
      err instanceof Error ? err : new Error('Failed to process map file')
    );
  }
}
