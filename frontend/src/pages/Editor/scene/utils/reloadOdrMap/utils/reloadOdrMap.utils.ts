import { DEFAULT_XODR } from '@editor/hooks/useThreeScene/hooks/useOdrLoader/utils/xodrRepository';
import { MAP_PATH } from '@editor/hooks/useThreeScene/hooks/useOdrLoader/types/useOdrLoaderTypes';
import { useEditorStore } from '@/store';
import { OpenDriveContext } from '../types/reloadOdrMapTypes';
import {
  OdrMapConfig,
  OpenDriveMapInstance,
} from '@/pages/Editor/types/editorTypes';

export function writeMapFile(context: OpenDriveContext, content: string): void {
  context.module!.FS_createDataFile('.', DEFAULT_XODR, content, true, true);
}
export function clearMapFile(context: OpenDriveContext): boolean {
  try {
    context.module!.FS_unlink(MAP_PATH);
    return true;
  } catch (error) {
    console.error(error);
    context.setStep('done');
    context.setError(
      error instanceof Error ? error : new Error('Failed to process map file')
    );
    return false;
  }
}

export function clearEditorState(): void {
  const store = useEditorStore.getState();

  const entityIds = {
    cars: store.cars.map((c) => c.id),
    points: store.points.map((p) => p.id),
    buildings: store.buildings.map((b) => b.id),
    rsus: store.RSUs.length,
  };

  entityIds.cars.forEach((id) => store.removeCar(id));
  entityIds.points.forEach((id) => store.removePoint(id));
  entityIds.buildings.forEach((id) => store.removeBuilding(id));

  for (let i = store.RSUs.length - 1; i >= 0; i--) {
    store.removeRSU(i);
  }

  store.selectObjects([]);
  useEditorStore.persist.clearStorage();
}
export function validateModule(context: OpenDriveContext): boolean {
  if (!context.module) {
    context.setStep('done');
    context.setError(new Error('OpenDRIVE module not initialized'));
    return false;
  }
  return true;
}

export function createMap(
  context: OpenDriveContext,
  config: OdrMapConfig
): OpenDriveMapInstance | null {
  try {
    if (context.map) {
      context.map.delete();
    }

    const newMap = new context.module!.OpenDriveMap(MAP_PATH, config);

    return newMap;
  } catch (error) {
    console.error(error);
    context.setStep('done');
    context.setError(
      error instanceof Error ? error : new Error('Failed to create map')
    );
    return null;
  }
}
