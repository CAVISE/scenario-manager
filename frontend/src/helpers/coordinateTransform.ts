export interface MapOffsets {
  x: number;
  y: number;
}

export function editorToCarla(
  x: number,
  y: number,
  z: number,
  offsets: MapOffsets,
  isSpawn = true,
): { x: number; y: number; z: number } {
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
  offsets: MapOffsets,
): { x: number; y: number; z: number } {
  return {
    x: x - offsets.x,
    y: -(y - offsets.y),
    z: z,
  };
}
