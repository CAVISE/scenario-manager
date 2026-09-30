import * as THREE from 'three';
import type { MutableRefObject, ReactNode } from 'react';
export interface CoordinatesWidgetProps {
  getCameraRef: () => THREE.PerspectiveCamera | undefined;
  getRoadMesh: () => THREE.Mesh | null;
}
import type { Vec3 } from '@/shared/types/sceneTypes';

export interface CoordinatesDisplayProps {
  coords: Vec3;
  onMap: boolean;
  offset: CarlaOffset;
}

export interface CarlaOffset {
  x: number;
  y: number;
}

export interface CarlaCoordinatesProps {
  x: number;
  y: number;
  z: number;
  offset: CarlaOffset;
}

export interface UseCoordinatesTrackingReturn {
  coords: Vec3 | null;
  onMap: boolean;
}

export interface UseCoordinatesTrackingOptions {
  cameraRef: MutableRefObject<THREE.PerspectiveCamera | undefined>;
  roadMeshRef: MutableRefObject<THREE.Object3D | null>;
}

export interface WidgetContainerProps {
  onMap: boolean;
  children: ReactNode;
}
