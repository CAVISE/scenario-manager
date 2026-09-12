import * as THREE from 'three';
import { Vec3 } from '../../editor.types';
import { Point } from '../../../../store/editor-store.types';

export const radius = 2;
export const segments = 32;

export interface LoadPointsContext {
  scene: THREE.Scene;
  cars: Vec3[];
  points: Point[][];
  cubeCircles: THREE.Mesh[][];
  lines: THREE.Line[][];
}
export interface ConnectLinesContext {
  scene: THREE.Scene;
  cars: Vec3[];
  points: Vec3[][];
  cubeCircles: THREE.Mesh[][];
  lines: THREE.Line[][];
}
