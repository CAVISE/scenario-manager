import type { OpenDriveMapInstance } from '@editor/types/editorTypes';

export type OdrMapOffsets = { x: number; y: number };

export function getOdrMapOffsets(
  map: OpenDriveMapInstance | null | undefined
): OdrMapOffsets | null {
  if (!map) return null;

  try {
    return { x: map.x_offs, y: map.y_offs };
  } catch {
    return null;
  }
}
