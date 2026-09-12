import * as THREE from 'three';
import { useEditorStore } from '@/store';
import { RestoreLidarsOptions } from '../types/restoreLidarsTypes';
import {
  LIDAR_BODY_COLOR,
  LIDAR_BODY_HEIGHT,
  LIDAR_BODY_RADIUS,
  LIDAR_BODY_SEGMENTS,
  LIDAR_CONE_COLOR,
  LIDAR_CONE_HEIGHT_RATIO,
  LIDAR_CONE_OFFSET_RATIO,
  LIDAR_CONE_OPACITY,
  LIDAR_CONE_OPEN_ENDED,
  LIDAR_CONE_RADIUS_RATIO,
  LIDAR_CONE_SEGMENTS,
} from '../constants/lidar.config';
import { createLidarUserData } from '../utils/lidar.utils';

export function restoreLidars(opts: RestoreLidarsOptions): void {
  const { carMeshesRef, updateSceneGraph } = opts;
  const carMeshes = carMeshesRef.current;
  if (!carMeshes) return;

  useEditorStore.getState().lidars.forEach((lidar) => {
    const wrapper = carMeshes.find((m) => m.userData.id === lidar.carId) as
      THREE.Group | undefined;
    if (!wrapper) return;
    if (wrapper.children.find((c) => c.userData.id === lidar.id)) return;

    const bodyGeo = new THREE.CylinderGeometry(
      LIDAR_BODY_RADIUS,
      LIDAR_BODY_RADIUS,
      LIDAR_BODY_HEIGHT,
      LIDAR_BODY_SEGMENTS
    );
    const body = new THREE.Mesh(
      bodyGeo,
      new THREE.MeshStandardMaterial({ color: LIDAR_BODY_COLOR })
    );
    body.userData = createLidarUserData(lidar);

    const coneGeo = new THREE.ConeGeometry(
      lidar.range * LIDAR_CONE_RADIUS_RATIO,
      lidar.range * LIDAR_CONE_HEIGHT_RATIO,
      LIDAR_CONE_SEGMENTS,
      1,
      LIDAR_CONE_OPEN_ENDED
    );
    const cone = new THREE.Mesh(
      coneGeo,
      new THREE.MeshBasicMaterial({
        color: LIDAR_CONE_COLOR,
        wireframe: true,
        transparent: true,
        opacity: LIDAR_CONE_OPACITY,
      })
    );
    cone.rotation.x = Math.PI;
    cone.position.z = lidar.range * LIDAR_CONE_OFFSET_RATIO;
    cone.userData = createLidarUserData(lidar);

    const group = new THREE.Group();
    group.userData = createLidarUserData(lidar);
    group.add(body, cone);
    group.position.set(lidar.x, lidar.y, lidar.z);
    group.rotation.z = lidar.rotation;
    group.scale.setScalar(1 / (wrapper.scale.x || 1));

    wrapper.add(group);
    updateSceneGraph();
  });
}
