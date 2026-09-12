import { setCachedCustomXodrContent } from '@editor/hooks/useThreeScene/hooks/useOdrLoader/utils/xodrRepository';
import {
  DEFAULT_MAP_CONFIG,
  LOAD_MAP_CONFIG,
  OpenDriveContext,
} from '../types/reloadOdrMapTypes';
import {
  clearEditorState,
  clearMapFile,
  createMap,
  validateModule,
  writeMapFile,
} from '../utils/reloadOdrMap.utils';

export function reloadOdrMap(context: OpenDriveContext): void {
  if (!validateModule(context)) return;

  clearEditorState();

  if (context.map) {
    context.map.delete();
    context.map = null;
  }

  const newMap = createMap(context, DEFAULT_MAP_CONFIG);
  if (newMap) {
    context.map = newMap;
    context.loadMap(true);
  }
}

export function loadFile(
  context: OpenDriveContext,
  fileText: string,
  clearMap: boolean
): void {
  if (!validateModule(context)) return;

  if (clearMap) {
    setCachedCustomXodrContent(fileText);
    clearEditorState();

    if (!clearMapFile(context)) {
      return;
    }
  }

  try {
    writeMapFile(context, fileText);

    const newMap = createMap(context, LOAD_MAP_CONFIG);
    if (newMap) {
      context.map = newMap;
      context.setStep('scene');
      context.loadMap(clearMap);
    }
  } catch (error) {
    console.error(error);
    context.setStep('done');
    context.setError(
      error instanceof Error ? error : new Error('Failed to process map file')
    );
  }
}
