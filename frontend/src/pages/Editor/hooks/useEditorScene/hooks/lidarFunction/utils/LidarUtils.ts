import * as THREE from 'three';
import { Lidar } from '../../../../../../../store/types/useEditorStoreTypes';
export function createLidarMesh(lidar: Lidar): THREE.Group {
  const group = new THREE.Group();
  group.userData = { type: 'lidar', id: lidar.id, carId: lidar.carId };

  const bodyGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 16);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.userData = { type: 'lidar', id: lidar.id, carId: lidar.carId };
  group.add(body);

  const coneGeo = new THREE.ConeGeometry(
    lidar.range * 0.1,
    lidar.range * 0.3,
    32,
    1,
    true,
  );
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    wireframe: true,
    transparent: true,
    opacity: 0.15,
  });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.rotation.x = Math.PI;
  cone.position.z = lidar.range * 0.15;
  cone.userData = { type: 'lidar', id: lidar.id, carId: lidar.carId };
  group.add(cone);

  group.position.set(lidar.x, lidar.y, lidar.z);
  group.rotation.z = lidar.rotation;

  return group;
}

export function disposeLidarGroup(group: THREE.Group) {
  group.traverse((child) => {
    const m = child as THREE.Mesh;
    if (m.isMesh) {
      m.geometry?.dispose();
      (Array.isArray(m.material) ? m.material : [m.material]).forEach((mt) =>
        mt?.dispose(),
      );
    }
  });
}
