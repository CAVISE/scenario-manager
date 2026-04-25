import * as THREE from 'three';
import { useEditorStore } from '../../../../../../store';
import { RestoreLidarsOptions } from '../types/restoreLidarsTypes';

export function restoreLidars(opts: RestoreLidarsOptions): void {
  const { carMeshesRef, updateSceneGraph } = opts;

  useEditorStore.getState().lidars.forEach((lidar) => {
    const wrapper = carMeshesRef.current.find(
      (m) => m.userData.id === lidar.carId,
    ) as THREE.Group | undefined;
    if (!wrapper) return;
    if (wrapper.children.find((c) => c.userData.id === lidar.id)) return;

    const bodyGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 16);
    const body = new THREE.Mesh(
      bodyGeo,
      new THREE.MeshStandardMaterial({ color: 0x222222 }),
    );
    body.userData = { type: 'lidar', id: lidar.id, carId: lidar.carId };

    const coneGeo = new THREE.ConeGeometry(
      lidar.range * 0.1,
      lidar.range * 0.3,
      32,
      1,
      true,
    );
    const cone = new THREE.Mesh(
      coneGeo,
      new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        wireframe: true,
        transparent: true,
        opacity: 0.15,
      }),
    );
    cone.rotation.x = Math.PI;
    cone.position.z = lidar.range * 0.15;
    cone.userData = { type: 'lidar', id: lidar.id, carId: lidar.carId };

    const group = new THREE.Group();
    group.userData = { type: 'lidar', id: lidar.id, carId: lidar.carId };
    group.add(body, cone);
    group.position.set(lidar.x, lidar.y, lidar.z);
    group.rotation.z = lidar.rotation;
    group.scale.setScalar(1 / (wrapper.scale.x || 1));
    wrapper.add(group);
    updateSceneGraph();
  });
}
