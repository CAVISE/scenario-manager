import * as THREE from 'three';
import type { MapControls } from 'three-stdlib';

export type CameraPreset = 'top' | 'isometric' | 'focus';

export function applyCameraPreset(
  preset: CameraPreset,
  camera: THREE.PerspectiveCamera,
  controls: MapControls,
  focusedObject?: THREE.Object3D | null
) {
  const target = focusedObject
    ? focusedObject.getWorldPosition(new THREE.Vector3())
    : controls.target.clone();
  const distance = Math.max(camera.position.distanceTo(controls.target), 20);

  if (preset === 'top') {
    camera.position.set(target.x, target.y, target.z + distance);
  } else if (preset === 'isometric') {
    const offset = distance / Math.sqrt(3);
    camera.position.set(
      target.x + offset,
      target.y - offset,
      target.z + offset
    );
  } else {
    const direction = camera.position.clone().sub(controls.target).normalize();
    camera.position.copy(target).addScaledVector(direction, distance);
  }

  controls.target.copy(target);
  controls.update();
}
