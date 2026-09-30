import type { Vec3 } from '@/shared/types/sceneTypes';
import type { Point } from '@/entities/vehicle';
import type * as THREE from 'three';
import type { TransformControls } from 'three-stdlib';

export interface LoadPointsContext {
  scene: THREE.Scene;
  cars: Vec3[];
  points: Point[][];
  routePointMeshes: THREE.Mesh[][];
  lines: THREE.Line[][];
  transformControlsRef: React.RefObject<TransformControls | null>;
}
export interface ConnectLinesContext {
  scene: THREE.Scene;
  cars: Vec3[];
  points: Vec3[][];
  routePointMeshes: THREE.Mesh[][];
  lines: THREE.Line[][];
}
