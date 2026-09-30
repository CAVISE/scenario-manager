import * as THREE from 'three';

export const PICKING_SHADERS = {
  idVertex: `attribute vec4 id; varying vec4 vId; void main() { vId = id; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  idFragment: `varying vec4 vId; void main() { gl_FragColor = vId; }`,
  xyzVertex: `varying vec3 vXYZ; void main() { vXYZ = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  xyzFragment: `varying vec3 vXYZ; void main() { gl_FragColor = vec4(vXYZ, 1.0); }`,
};

const makeScene = (): THREE.Scene => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  return scene;
};

export const picking = {
  scenes: {
    lane: makeScene(),
    roadmark: makeScene(),
    xyz: makeScene(),
  },
  textures: {
    lane: new THREE.WebGLRenderTarget(1, 1, { type: THREE.FloatType }),
    roadmark: new THREE.WebGLRenderTarget(1, 1, { type: THREE.FloatType }),
    xyz: new THREE.WebGLRenderTarget(1, 1, { type: THREE.FloatType }),
  },
  materials: {
    id: new THREE.ShaderMaterial({
      vertexShader: PICKING_SHADERS.idVertex,
      fragmentShader: PICKING_SHADERS.idFragment,
    }),
    xyz: new THREE.ShaderMaterial({
      vertexShader: PICKING_SHADERS.xyzVertex,
      fragmentShader: PICKING_SHADERS.xyzFragment,
    }),
  },
};
