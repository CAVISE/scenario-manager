import { GLTFLoader } from 'three-stdlib';
import * as THREE from 'three';
import type { RsuModel } from '@/entities/roadside-unit';

const loader = new GLTFLoader();
const models = new Map<RsuModel, THREE.Object3D>();
const pending = new Map<RsuModel, Promise<boolean>>();
const paths: Record<RsuModel, string> = {
  hydrant: '/hydrant.glb',
  'traffic-light': '/pedestrian_traffic_light.glb',
};

export function getRsuModel(model: RsuModel = 'hydrant') {
  return models.get(model);
}

export function ensureRsuModel(model: RsuModel = 'hydrant'): Promise<boolean> {
  if (models.has(model)) return Promise.resolve(true);
  const request = pending.get(model);
  if (request) return request;
  const promise = new Promise<boolean>((resolve) => {
    loader.load(
      paths[model] ?? paths.hydrant,
      (gltf) => {
        models.set(model, gltf.scene);
        resolve(true);
      },
      undefined,
      () => resolve(false)
    );
  });
  pending.set(model, promise);
  void promise.then(() => pending.delete(model));
  return promise;
}
