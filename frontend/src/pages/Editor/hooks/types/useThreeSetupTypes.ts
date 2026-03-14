import { MapControls, TransformControls } from 'three-stdlib';
import * as THREE from 'three';
export const PICKING_SHADERS = {
  idVertex:    `attribute vec4 id; varying vec4 vId; void main() { vId = id; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  idFragment:  `varying vec4 vId; void main() { gl_FragColor = vId; }`,
  xyzVertex:   `varying vec3 vXYZ; void main() { vXYZ = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  xyzFragment: `varying vec3 vXYZ; void main() { gl_FragColor = vec4(vXYZ, 1.0); }`,
  stVertex:    `attribute vec2 st; varying vec2 vST; void main() { vST = st; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  stFragment:  `varying vec2 vST; void main() { gl_FragColor = vec4(vST.x, vST.y, 0.0, 1.0); }`,
};

export interface PickingScenes {
  lane:     THREE.Scene;
  roadmark: THREE.Scene;
  xyz:      THREE.Scene;
  st:       THREE.Scene;
}

export interface PickingTextures {
  lane:     THREE.WebGLRenderTarget;
  roadmark: THREE.WebGLRenderTarget;
  xyz:      THREE.WebGLRenderTarget;
  st:       THREE.WebGLRenderTarget;
}

export interface PickingMaterials {
  id:  THREE.ShaderMaterial;
  xyz: THREE.ShaderMaterial;
  st:  THREE.ShaderMaterial;
}

export interface ThreeSetup {
  renderer:         THREE.WebGLRenderer;
  scene:            THREE.Scene;
  camera:           THREE.PerspectiveCamera;
  controls:         MapControls;
  transformControls:TransformControls;
  light:            THREE.DirectionalLight;
  picking:          { scenes: PickingScenes; textures: PickingTextures; materials: PickingMaterials };
}