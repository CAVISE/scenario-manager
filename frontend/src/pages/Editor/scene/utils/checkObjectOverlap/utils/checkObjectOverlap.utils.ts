import { Footprint2D, Vec2 } from '../types/checkObjectOverlapTypes';

export function getCorners(fp: Footprint2D): Vec2[] {
  const cos = Math.cos(fp.rotation);
  const sin = Math.sin(fp.rotation);

  const localCorners: Vec2[] = [
    { x: -fp.halfExtentX, y: -fp.halfExtentY },
    { x: fp.halfExtentX, y: -fp.halfExtentY },
    { x: fp.halfExtentX, y: fp.halfExtentY },
    { x: -fp.halfExtentX, y: fp.halfExtentY },
  ];

  return localCorners.map((c) => ({
    x: fp.centerX + c.x * cos - c.y * sin,
    y: fp.centerY + c.x * sin + c.y * cos,
  }));
}

export function getAxes(rotation: number): Vec2[] {
  return [
    { x: Math.cos(rotation), y: Math.sin(rotation) },
    { x: -Math.sin(rotation), y: Math.cos(rotation) },
  ];
}

export function projectOntoAxis(
  corners: Vec2[],
  axis: Vec2
): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;

  for (const c of corners) {
    const proj = c.x * axis.x + c.y * axis.y;
    if (proj < min) min = proj;
    if (proj > max) max = proj;
  }

  return { min, max };
}
