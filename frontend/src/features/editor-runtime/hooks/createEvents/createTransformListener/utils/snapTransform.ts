import * as THREE from 'three';
import { useWorkspacePreferences } from '@/store/ui/useWorkspacePreferences';

type TransformableEntity =
  'car' | 'rsu' | 'lidar' | 'building' | 'pedestrian' | 'route-point';

export function snapTransform(
  target: THREE.Object3D,
  type: TransformableEntity,
  road: THREE.Mesh | null = null
) {
  const preferences = useWorkspacePreferences.getState();

  if (preferences.snapToGrid) {
    target.position.x = snapValue(target.position.x, preferences.gridSnapStep);
    target.position.y = snapValue(target.position.y, preferences.gridSnapStep);
  }

  if (preferences.snapToRoad && road && shouldSnapToRoad(type)) {
    snapObjectToRoad(target, road);
  }

  if (preferences.snapRotation) {
    const axis = type === 'building' ? 'y' : 'z';
    target.rotation[axis] = snapValue(
      target.rotation[axis],
      THREE.MathUtils.degToRad(preferences.rotationSnapDegrees)
    );
  }
}

function shouldSnapToRoad(type: TransformableEntity) {
  return type !== 'lidar';
}

function snapObjectToRoad(target: THREE.Object3D, road: THREE.Mesh) {
  const raycaster = new THREE.Raycaster(
    new THREE.Vector3(
      target.position.x,
      target.position.y,
      target.position.z + 10000
    ),
    new THREE.Vector3(0, 0, -1)
  );
  const [intersection] = raycaster.intersectObject(road, true);
  if (intersection) target.position.z = intersection.point.z;
}

function snapValue(value: number, step: number) {
  return Math.round(value / step) * step;
}
