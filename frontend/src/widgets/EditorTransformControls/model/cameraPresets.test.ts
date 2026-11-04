import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { MapControls } from 'three-stdlib';
import { applyCameraPreset } from './cameraPresets';

function createCameraSetup() {
  const camera = new THREE.PerspectiveCamera();
  camera.position.set(10, -10, 10);
  const controls = {
    target: new THREE.Vector3(),
    update: () => undefined,
  } as unknown as MapControls;
  return { camera, controls };
}

describe('applyCameraPreset', () => {
  it('moves the camera above its current target', () => {
    const { camera, controls } = createCameraSetup();
    controls.target.set(2, 3, 4);

    applyCameraPreset('top', camera, controls);

    expect(camera.position.x).toBe(2);
    expect(camera.position.y).toBe(3);
    expect(camera.position.z).toBeGreaterThan(4);
  });

  it('focuses the camera on the selected object', () => {
    const { camera, controls } = createCameraSetup();
    const object = new THREE.Object3D();
    object.position.set(30, 40, 5);

    applyCameraPreset('focus', camera, controls, object);

    expect(controls.target.toArray()).toEqual([30, 40, 5]);
  });
});
