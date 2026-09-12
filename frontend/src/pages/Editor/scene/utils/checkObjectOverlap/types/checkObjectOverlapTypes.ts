export interface Footprint2D {
  centerX: number;
  centerY: number;
  halfExtentX: number;
  halfExtentY: number;
  rotation: number;
}

export interface OverlapCheckResult {
  overlaps: boolean;
  penetrationDepth?: number;
}
export interface Vec2 {
  x: number;
  y: number;
}
