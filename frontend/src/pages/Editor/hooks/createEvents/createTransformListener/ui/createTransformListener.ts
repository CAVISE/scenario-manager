import * as THREE from 'three';
import { useEditorStore } from '../../../../../../store';
import { CreateTransformListenerOptions } from '../types/createTransformListenerTypes';

export function createTransformListener(
  opts: CreateTransformListenerOptions,
): () => void {
  const { transformControls, carMeshesRef, cubeCirclesRef, carQuaternionsRef } =
    opts;

  const handler = () => {
    try {
      const obj = (
        transformControls as unknown as { object: THREE.Object3D | undefined }
      ).object;
      if (!obj?.userData) return;
      const { type, id } = obj.userData;

      if (type === 'car' && id) {
        carQuaternionsRef.current.set(id, obj.quaternion.clone());
        useEditorStore.getState().updateCar(id, {
          x: obj.position.x,
          y: obj.position.y,
          z: obj.position.z,
          rotation: obj.rotation.z,
          scale: obj.scale.x,
        });
      }

      if (type === 'point' && id) {
        useEditorStore.getState().updateRSU(id, {
          x: obj.position.x,
          y: obj.position.y,
          z: obj.position.z,
        });
      }

      if (type === 'lidar' && id) {
        useEditorStore.getState().updateLidar(id, {
          x: obj.position.x,
          y: obj.position.y,
          z: obj.position.z,
          rotation: obj.rotation.z,
        });
      }

      if (type === 'building' && id) {
        useEditorStore.getState().updateBuilding(id, {
          x: obj.position.x,
          y: obj.position.y,
          z: obj.position.z,
          rotation: obj.rotation.y,
          scale: obj.scale.x,
          material: obj.userData.material,
          height: obj.userData.height,
        });
      }

      if (type === 'pedestrian' && id) {
        const isRoot = !obj.parent || obj.parent.userData.type !== 'pedestrian';
        if (isRoot) {
          const worldPos = new THREE.Vector3();
          obj.getWorldPosition(worldPos);
          useEditorStore.getState().updatePedestrian(id, {
            x: worldPos.x,
            y: worldPos.y,
            z: worldPos.z,
          });
        }
      }

      if (type === 'circle') {
        const circles = cubeCirclesRef.current;
        for (let i = 0; i < circles.length; i++) {
          const ci = circles[i].indexOf(obj as THREE.Mesh);
          if (ci !== -1) {
            const carId = carMeshesRef.current[i]?.userData.id;
            const pt = useEditorStore
              .getState()
              .points.filter((p) => p.carId === carId)[ci];
            if (pt)
              useEditorStore.getState().updatePoint(pt.id, {
                x: obj.position.x,
                y: obj.position.y,
                z: obj.position.z,
              });
            useEditorStore
              .getState()
              .selectObject({ type: 'point', id: pt?.id || '' });
            break;
          }
        }
      }
    } catch (err) {
      console.error('objectChange error:', err);
    }
  };

  transformControls.addEventListener('objectChange' as never, handler);
  return () =>
    transformControls.removeEventListener('objectChange' as never, handler);
}
