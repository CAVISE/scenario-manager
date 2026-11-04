import * as THREE from 'three';
import type { Lidar } from '@/entities/vehicle';
import {
  LIDAR_ACCENT_COLOR,
  LIDAR_BASE_COLOR,
  LIDAR_BODY_RADIUS,
  LIDAR_BODY_SEGMENTS,
  LIDAR_CONE_COLOR,
  LIDAR_CONE_HEIGHT_RATIO,
  LIDAR_CONE_OFFSET_RATIO,
  LIDAR_CONE_OPEN_ENDED,
  LIDAR_CONE_OPACITY,
  LIDAR_CONE_RADIUS_RATIO,
  LIDAR_CONE_SEGMENTS,
  LIDAR_GLASS_COLOR,
  LIDAR_HOUSING_COLOR,
} from '../constants/lidar.config';
import { createLidarUserData } from './lidar.utils';
import { useWorkspacePreferences } from '@/store/ui/useWorkspacePreferences';
import { isEditorVisualVisible } from '@editor/lib/visualPreferences';

const SCAN_RING_POSITIONS = [0.34, 0.62, 0.9] as const;

export function createLidarMesh(lidar: Lidar): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Lidar sensor';
  group.userData = createLidarUserData(lidar);

  group.add(createBase(lidar), createScanCone(lidar));
  addSensorHead(group, lidar);
  addScanRings(group, lidar);

  group.position.set(lidar.x, lidar.y, lidar.z);
  group.rotation.z = lidar.rotation;
  return group;
}

export function updateLidarScanVolume(group: THREE.Group, lidar: Lidar) {
  const cone = group.children.find(
    (child) =>
      (child as THREE.Mesh).isMesh &&
      (child as THREE.Mesh).geometry instanceof THREE.ConeGeometry
  ) as THREE.Mesh | undefined;
  if (cone) {
    cone.geometry.dispose();
    cone.geometry = createScanConeGeometry(lidar.range);
    cone.position.z = lidar.range * LIDAR_CONE_OFFSET_RATIO;
  }

  group.children
    .filter((child) => child.userData.isLidarRangeDecoration)
    .forEach((ring) => {
      group.remove(ring);
      disposeObject(ring);
    });
  addScanRings(group, lidar);
}

export function disposeLidarGroup(group: THREE.Group) {
  disposeObject(group);
}

function createBase(lidar: Lidar): THREE.Mesh {
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.25, 0.1, LIDAR_BODY_SEGMENTS),
    new THREE.MeshStandardMaterial({
      color: LIDAR_BASE_COLOR,
      roughness: 0.42,
      metalness: 0.72,
    })
  );
  base.name = 'Lidar mounting base';
  base.rotation.x = Math.PI / 2;
  base.position.z = 0.05;
  base.userData = createLidarUserData(lidar);
  return base;
}

function addSensorHead(group: THREE.Group, lidar: Lidar) {
  const sensorData = createLidarUserData(lidar);
  const addCylinder = (
    name: string,
    radius: number,
    height: number,
    z: number,
    material: THREE.Material
  ) => {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, height, LIDAR_BODY_SEGMENTS),
      material
    );
    mesh.name = name;
    mesh.rotation.x = Math.PI / 2;
    mesh.position.z = z;
    mesh.userData = sensorData;
    group.add(mesh);
  };

  addCylinder(
    'Lidar support stem',
    0.11,
    0.34,
    0.25,
    new THREE.MeshStandardMaterial({
      color: LIDAR_HOUSING_COLOR,
      metalness: 0.7,
    })
  );
  addCylinder(
    'Lidar lower housing',
    LIDAR_BODY_RADIUS,
    0.16,
    0.49,
    new THREE.MeshStandardMaterial({
      color: LIDAR_HOUSING_COLOR,
      metalness: 0.62,
    })
  );
  addCylinder(
    'Lidar scanning glass',
    LIDAR_BODY_RADIUS + 0.015,
    0.16,
    0.64,
    new THREE.MeshStandardMaterial({
      color: LIDAR_GLASS_COLOR,
      metalness: 0.25,
      roughness: 0.14,
      transparent: true,
      opacity: 0.82,
      emissive: LIDAR_GLASS_COLOR,
      emissiveIntensity: 0.22,
    })
  );
  addCylinder(
    'Lidar top cap',
    LIDAR_BODY_RADIUS * 0.9,
    0.12,
    0.78,
    new THREE.MeshStandardMaterial({ color: LIDAR_BASE_COLOR, metalness: 0.76 })
  );

  for (const [index, angle] of [
    0,
    Math.PI / 2,
    Math.PI,
    Math.PI * 1.5,
  ].entries()) {
    const emitter = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.08, 0.07),
      new THREE.MeshBasicMaterial({ color: LIDAR_ACCENT_COLOR })
    );
    emitter.name = `Lidar emitter ${index + 1}`;
    emitter.position.set(Math.cos(angle) * 0.3, Math.sin(angle) * 0.3, 0.64);
    emitter.userData = sensorData;
    group.add(emitter);
  }
}

function createScanCone(lidar: Lidar): THREE.Mesh {
  const cone = new THREE.Mesh(
    createScanConeGeometry(lidar.range),
    new THREE.MeshBasicMaterial({
      color: LIDAR_CONE_COLOR,
      transparent: true,
      opacity: LIDAR_CONE_OPACITY,
      depthWrite: false,
    })
  );
  cone.name = 'Lidar coverage volume';
  cone.visible = isEditorVisualVisible(
    useWorkspacePreferences.getState(),
    'lidarCoverage'
  );
  cone.rotation.x = Math.PI;
  cone.position.z = lidar.range * LIDAR_CONE_OFFSET_RATIO;
  cone.renderOrder = 40;
  cone.userData = createLidarUserData(lidar);
  return cone;
}

function createScanConeGeometry(range: number): THREE.ConeGeometry {
  return new THREE.ConeGeometry(
    range * LIDAR_CONE_RADIUS_RATIO,
    range * LIDAR_CONE_HEIGHT_RATIO,
    LIDAR_CONE_SEGMENTS,
    1,
    LIDAR_CONE_OPEN_ENDED
  );
}

function addScanRings(group: THREE.Group, lidar: Lidar) {
  const height = lidar.range * LIDAR_CONE_HEIGHT_RATIO;
  const maximumRadius = lidar.range * LIDAR_CONE_RADIUS_RATIO;
  const cone = group.children.find(
    (child) =>
      (child as THREE.Mesh).isMesh &&
      (child as THREE.Mesh).geometry instanceof THREE.ConeGeometry
  ) as THREE.Mesh | undefined;
  if (!cone) return;

  const ringOrientation = new THREE.Quaternion()
    .setFromEuler(cone.rotation)
    .multiply(
      new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        -Math.PI / 2
      )
    );
  SCAN_RING_POSITIONS.forEach((progress) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(maximumRadius * progress, 0.06, 6, 36),
      new THREE.MeshBasicMaterial({
        color: 0xd9f99d,
        opacity: 1,
        depthWrite: false,
      })
    );
    ring.name = `Lidar range ring ${Math.round(progress * 100)}%`;
    ring.visible = isEditorVisualVisible(
      useWorkspacePreferences.getState(),
      'lidarCoverage'
    );
    ring.position
      .set(0, -height / 2 + height * progress, 0)
      .applyEuler(cone.rotation)
      .add(cone.position);
    ring.quaternion.copy(ringOrientation);
    ring.renderOrder = 41;
    ring.userData = {
      ...createLidarUserData(lidar),
      isLidarRangeDecoration: true,
    };
    group.add(ring);
  });
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(
      (material) => material?.dispose()
    );
  });
}
