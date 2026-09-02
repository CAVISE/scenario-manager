import { Vec3 } from '@editor/types/editorTypes';
import { Point } from '@/store/types/useEditorStoreTypes';
import * as THREE from 'three';
import { TransformControls } from 'three-stdlib';

export const radius = 2;
export const segments = 32;

export interface LoadPointsContext {
  scene: THREE.Scene;
  cars: Vec3[];
  points: Point[][];
  cubeCircles: THREE.Mesh[][];
  lines: THREE.Line[][];
  transformControlsRef: React.RefObject<TransformControls | null>;
}
export interface ConnectLinesContext {
  scene: THREE.Scene;
  cars: Vec3[];
  points: Vec3[][];
  cubeCircles: THREE.Mesh[][];
  lines: THREE.Line[][];
}
