import { MapControls, TransformControls } from 'three-stdlib';
import * as THREE from 'three';

export interface PickingScenes {
  lane: THREE.Scene;
  roadmark: THREE.Scene;
  xyz: THREE.Scene;
}

export interface PickingTextures {
  lane: THREE.WebGLRenderTarget;
  roadmark: THREE.WebGLRenderTarget;
  xyz: THREE.WebGLRenderTarget;
}

export interface PickingMaterials {
  id: THREE.ShaderMaterial;
  xyz: THREE.ShaderMaterial;
}

export interface ThreeSetup {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: MapControls;
  transformControls: TransformControls;
  light: THREE.DirectionalLight;
  picking: {
    scenes: PickingScenes;
    textures: PickingTextures;
    materials: PickingMaterials;
  };
}

export interface CreateThreeSetupResult {
  setup: ThreeSetup;
  dispose: () => void;
}
