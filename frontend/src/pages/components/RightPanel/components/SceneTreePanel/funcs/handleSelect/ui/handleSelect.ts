import * as THREE from 'three';
import { findObjectInScene } from '../../sceneUtils';
import { useEditorStore } from '../../../../../../../../store';
import { handleSelectProps } from '../types/handleSelectTypes';

export function handleSelect({
  sceneRef,
  transformControlsRef,
  detachTransformControls,
  itemId,
  pointsArrRef,
  selectObject,
  onSelectObject,
  carMeshesRef,
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
  tc.detach();

  if (type === 'point') {
    let rsuMesh = pointsArrRef.current.find((p) => p.userData.id === itemId);

    if (!rsuMesh) {
      rsuMesh = found as THREE.Mesh;
      pointsArrRef.current.push(rsuMesh);
    }

    if (rsuMesh) {
      tc.attach(rsuMesh);
      selectObject({ type: 'rsu', id: itemId });
      onSelectObject({ type: 'rsu', id: itemId, position: rsuMesh.position });
      return;
    }
  }

  if (type === 'lidar') {
    let lidarMesh: THREE.Object3D | null = null;
    carMeshesRef.current.forEach((car) => {
      car.traverse((child) => {
        if (child.userData.id === itemId) lidarMesh = child;
      });
    });

    if (lidarMesh) {
      tc.attach(lidarMesh as THREE.Object3D);
      selectObject({ type: 'lidar', id: itemId });
      onSelectObject({ type: 'lidar', id: itemId });
      return;
    }
  }

  if (type === 'circle') {
    tc.attach(obj);
    const { points } = useEditorStore.getState();
    const pt = points.find(
      (p) =>
        Math.abs(p.x - obj.position.x) < 0.001 &&
        Math.abs(p.y - obj.position.y) < 0.001,
    );
    const pointId = pt?.id;
    if (pointId) selectObject({ type: 'point', id: pointId });
    else selectObject(null);
    onSelectObject({ type: 'point', id: pointId, position: obj.position });
    return;
  }

  if (type === 'pedestrian') {
    let root = obj;
    while (root.parent && root.parent.userData.type === 'pedestrian') {
      root = root.parent;
    }
    tc.attach(root);
    selectObject({ type: 'pedestrian', id: root.userData.id });
    onSelectObject({
      type: 'pedestrian',
      id: root.userData.id,
      position: root.position,
    });
    return;
  }

  tc.attach(obj);
  selectObject({ type, id: itemId });
  onSelectObject({ type, id: itemId });
}
