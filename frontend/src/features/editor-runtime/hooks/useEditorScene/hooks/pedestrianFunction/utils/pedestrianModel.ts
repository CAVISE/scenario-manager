import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';

const loader = new GLTFLoader();
let pedestrianModel: THREE.Object3D | null = null;
let modelPromise: Promise<boolean> | null = null;

export function ensurePedestrianModel(): Promise<boolean> {
  if (pedestrianModel) return Promise.resolve(true);
  if (modelPromise) return modelPromise;
  modelPromise = new Promise((resolve) => {
    loader.load(
      '/man_in_suit.glb',
      (gltf) => {
        pedestrianModel = gltf.scene;
        resolve(true);
      },
      undefined,
      () => {
        modelPromise = null;
        resolve(false);
      }
    );
  });
  return modelPromise;
}

export function getPedestrianModel(): THREE.Object3D | null {
  return pedestrianModel;
}
