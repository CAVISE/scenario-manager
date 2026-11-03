import type {
  Coordinate3D,
  MapOffsets,
} from '@/shared/types/coordinateTransformTypes';

export function odrOffsetsToCarlaOffsets(offsets: MapOffsets): MapOffsets {
  return { x: offsets.x, y: -offsets.y };
}

export function editorToCarla(
  x: number,
  y: number,
  z: number,
  offsets: MapOffsets,
  isSpawn = true
): Coordinate3D {
  return {
    x: x + offsets.x,
    y: -y + offsets.y,
    z: isSpawn ? z + 1 : 0,
  };
}

export function carlaToEditor(
  x: number,
  y: number,
  z: number,
  offsets: MapOffsets
): Coordinate3D {
  return {
    x: x - offsets.x,
    y: -(y - offsets.y),
    z: z,
  };
}
