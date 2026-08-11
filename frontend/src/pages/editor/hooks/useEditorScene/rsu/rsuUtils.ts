import { GLTFLoader } from 'three-stdlib';
import * as THREE from 'three';

export let rsuModel: THREE.Object3D | null = null;
export const loader = new GLTFLoader();
export let rsuModelPromise: Promise<boolean> | null = null;

export function ensureRsuModel(): Promise<boolean> {
  if (rsuModel) return Promise.resolve(true);
  if (rsuModelPromise) return rsuModelPromise;
  rsuModelPromise = new Promise((resolve) => {
    loader.load(
      '/pedestrian_traffic_light.glb',
      (gltf) => {
        rsuModel = gltf.scene;
        resolve(true);
      },
      undefined,
      () => {
        rsuModel = null;
        resolve(false);
      },
    );
  });
  return rsuModelPromise;
}
