import * as THREE from 'three';
import { MapControls } from 'three-stdlib';

import {
  PickingScenes,
  PickingTextures,
} from '../../useThreeSetup/types/useThreeSetupTypes';
import { OpenDriveMapInstance } from '../../../../types/editorTypes';

export interface SpotlightState {
  paused: boolean;
  INTERSECTED_LANE_ID: number;
  INTERSECTED_ROADMARK_ID: number;
}

export interface StartAnimateParams {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: MapControls;
  mouse: THREE.Vector2;
  spotlightEnabled: () => boolean;
  spotlightState: SpotlightState;
  picking: { scenes: PickingScenes; textures: PickingTextures };
  getOpenDriveMap: () => OpenDriveMapInstance | null;
  getRoadMesh: () => THREE.Mesh | null;
  getRoadmarksMesh: () => THREE.Mesh | null;
  spotlightInfo: HTMLElement | null;
  onBeforeRender?: () => void;
}
