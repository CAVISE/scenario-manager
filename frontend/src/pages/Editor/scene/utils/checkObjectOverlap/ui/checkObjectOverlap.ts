import type {
  Footprint2D,
  OverlapCheckResult,
} from '../types/checkObjectOverlapTypes';

export interface Vec2 {
  x: number;
  y: number;
}

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

function getAxes(rotation: number): Vec2[] {
  return [
    { x: Math.cos(rotation), y: Math.sin(rotation) },
    { x: -Math.sin(rotation), y: Math.cos(rotation) },
  ];
}

function projectOntoAxis(
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

export function checkObjectOverlap(
  a: Footprint2D,
  b: Footprint2D
): OverlapCheckResult {
  const cornersA = getCorners(a);
  const cornersB = getCorners(b);
  const axes = [...getAxes(a.rotation), ...getAxes(b.rotation)];

  let minPenetration = Infinity;

  for (const axis of axes) {
    const projA = projectOntoAxis(cornersA, axis);
    const projB = projectOntoAxis(cornersB, axis);

    const separated = projA.max < projB.min || projB.max < projA.min;
    if (separated) {
      return { overlaps: false };
    }

    const overlapOnAxis =
      Math.min(projA.max, projB.max) - Math.max(projA.min, projB.min);
    if (overlapOnAxis < minPenetration) {
      minPenetration = overlapOnAxis;
    }
  }

  return { overlaps: true, penetrationDepth: minPenetration };
}
