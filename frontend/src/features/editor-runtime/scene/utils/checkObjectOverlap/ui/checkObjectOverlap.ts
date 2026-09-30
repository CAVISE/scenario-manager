import type {
  Footprint2D,
  OverlapCheckResult,
} from '../types/checkObjectOverlapTypes';
import {
  getAxes,
  getCorners,
  projectOntoAxis,
} from '../utils/checkObjectOverlap.utils';

export function checkObjectOverlap(
  a: Footprint2D,
  b: Footprint2D
): OverlapCheckResult {
  if (
    a.halfExtentX === 0 ||
    a.halfExtentY === 0 ||
    b.halfExtentX === 0 ||
    b.halfExtentY === 0
  ) {
    return { overlaps: false };
  }

  const cornersA = getCorners(a);
  const cornersB = getCorners(b);
  const axes = [...getAxes(a.rotation), ...getAxes(b.rotation)];

  let minPenetration = Infinity;

  for (const axis of axes) {
    const projA = projectOntoAxis(cornersA, axis);
    const projB = projectOntoAxis(cornersB, axis);

    if (projA.max < projB.min || projB.max < projA.min) {
      return { overlaps: false };
    }

    const overlap =
      Math.min(projA.max, projB.max) - Math.max(projA.min, projB.min);
    if (overlap < minPenetration) {
      minPenetration = overlap;
    }
  }

  return {
    overlaps: true,
    penetrationDepth: minPenetration,
  };
}
