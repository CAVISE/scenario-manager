import * as THREE from 'three';
import { useEditorStore } from '@/store';
import { handleSelectProps } from '../types/handleSelectTypes';
import { findObjectInScene } from '../../sceneUtils';

export function handleSelect({
  sceneRef,
  transformControlsRef,
  detachTransformControls,
  itemId,
  pointsArrRef,
  selectObjects,
  onSelectObjects,
  carMeshesRef,
  focusObject,
}: handleSelectProps) {
  const scene = sceneRef.current;
  const tc = transformControlsRef.current;
  if (!scene || !tc) return;

  const found = findObjectInScene({ itemId, sceneRef });
  if (!found) {
    detachTransformControls();
    return;
  }

  const obj = found as THREE.Object3D;
  const type = obj.userData.type;
  focusObject(obj);
  tc.detach();

  if (type === 'point') {
    const pointsArr = pointsArrRef.current;
    if (!pointsArr) return;
    const idx = pointsArr.findIndex((p) => p.userData.id === itemId);
    let rsuMesh = idx !== -1 ? pointsArr[idx] : undefined;

    if (!rsuMesh || rsuMesh !== found) {
      rsuMesh = found as THREE.Mesh;
      if (idx !== -1) {
        pointsArr[idx] = rsuMesh;
      } else {
        pointsArr.push(rsuMesh);
      }
    }

    if (rsuMesh) {
      tc.attach(rsuMesh);
      selectObjects([{ type: 'rsu', id: itemId }]);
      onSelectObjects([
        { type: 'rsu', id: itemId, position: rsuMesh.position },
      ]);
      return;
    }
  }

  if (type === 'lidar') {
    let lidarMesh: THREE.Object3D | null = null;
    const carMeshes = carMeshesRef.current;
    if (!carMeshes) return;
    carMeshes.forEach((car) => {
      car.traverse((child) => {
        if (child.userData.id === itemId) lidarMesh = child;
      });
    });

    if (lidarMesh) {
      tc.attach(lidarMesh as THREE.Object3D);
      selectObjects([{ type: 'lidar', id: itemId }]);
      onSelectObjects([{ type: 'lidar', id: itemId }]);
      return;
    }
  }

  if (type === 'circle') {
    tc.attach(obj);
    const { points } = useEditorStore.getState();
    const pt = points.find(
      (p) =>
        Math.abs(p.x - obj.position.x) < 0.001 &&
        Math.abs(p.y - obj.position.y) < 0.001
    );
    const pointId = pt?.id;
    if (pointId) selectObjects([{ type: 'point', id: pointId }]);
    else selectObjects([]);
    onSelectObjects([{ type: 'point', id: pointId, position: obj.position }]);
    return;
  }

  if (type === 'pedestrian') {
    let root = obj;
    while (root.parent && root.parent.userData.type === 'pedestrian') {
      root = root.parent;
    }
    tc.attach(root);
    selectObjects([{ type: 'pedestrian', id: root.userData.id }]);
    onSelectObjects([
      {
        type: 'pedestrian',
        id: root.userData.id,
        position: root.position,
      },
    ]);
    return;
  }

  tc.attach(obj);
  selectObjects([{ type, id: itemId }]);
  onSelectObjects([{ type, id: itemId }]);
}
