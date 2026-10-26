import { useEditorStore } from '@/store';
import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import type { CreateTransformListenerOptions } from '../types/createTransformListenerTypes';
import {
  updateRouteLinesForCar,
  updateRouteLinesForWaypoint,
} from '@editor/scene/loaders/loadPoints/utils/routeLine';
import { snapTransform } from './snapTransform';

interface CreateObjectChangeHandlerOptions {
  transformControls: CreateTransformListenerOptions['transformControls'];
  carMeshesRef: MutableRefObject<THREE.Mesh[]>;
  routePointMeshesRef: MutableRefObject<THREE.Mesh[][]>;
  localLineArrRef: MutableRefObject<THREE.Mesh[][]>;
  roadMeshRef: MutableRefObject<THREE.Mesh | null>;
  carQuaternionsRef: MutableRefObject<Map<string, THREE.Quaternion>>;
}

export function createObjectChangeHandler({
  transformControls,
  carMeshesRef,
  routePointMeshesRef,
  localLineArrRef,
  roadMeshRef,
  carQuaternionsRef,
}: CreateObjectChangeHandlerOptions) {
  return (obj?: THREE.Object3D) => {
    try {
      const target =
        obj ??
        (
          transformControls as unknown as {
            object: THREE.Object3D | undefined;
          }
        ).object;
      if (!target?.userData) return;
      const { type, id } = target.userData;
      if (
        type === 'car' ||
        type === 'rsu' ||
        type === 'lidar' ||
        type === 'building' ||
        type === 'pedestrian' ||
        type === 'route-point'
      ) {
        snapTransform(target, type, roadMeshRef.current);
      }

      if (type === 'car' && id) {
        const carIndex = carMeshesRef.current.indexOf(target as THREE.Mesh);
        if (carIndex >= 0) {
          updateRouteLinesForCar(
            target,
            routePointMeshesRef.current[carIndex],
            localLineArrRef.current[carIndex]
          );
        }
        carQuaternionsRef.current.set(id, target.quaternion.clone());
        useEditorStore.getState().updateCar(id, {
          x: target.position.x,
          y: target.position.y,
          z: target.position.z,
          rotation: target.rotation.z,
          scale: target.scale.x,
        });
      }

      if (type === 'rsu' && id) {
        useEditorStore.getState().updateRSU(id, {
          x: target.position.x,
          y: target.position.y,
          z: target.position.z,
        });
      }

      if (type === 'lidar' && id) {
        useEditorStore.getState().updateLidar(id, {
          x: target.position.x,
          y: target.position.y,
          z: target.position.z,
          rotation: target.rotation.z,
        });
      }

      if (type === 'building' && id) {
        useEditorStore.getState().updateBuilding(id, {
          x: target.position.x,
          y: target.position.y,
          z: target.position.z,
          rotation: target.rotation.y,
          scale: target.scale.x,
          material: target.userData.material,
          height: target.userData.height,
        });
      }

      if (type === 'pedestrian' && id) {
        const isRoot =
          !target.parent || target.parent.userData.type !== 'pedestrian';
        if (isRoot) {
          const worldPos = new THREE.Vector3();
          target.getWorldPosition(worldPos);
          useEditorStore.getState().updatePedestrian(id, {
            x: worldPos.x,
            y: worldPos.y,
            z: worldPos.z,
          });
        }
      }

      if (type === 'route-point') {
        const routePointMeshes = routePointMeshesRef.current;
        for (let i = 0; i < routePointMeshes.length; i++) {
          const ci = routePointMeshes[i].indexOf(target as THREE.Mesh);
          if (ci === -1) continue;
          const carId = carMeshesRef.current[i]?.userData.id;
          const point = useEditorStore
            .getState()
            .points.filter((entry) => entry.carId === carId)[ci];
          if (point) {
            useEditorStore.getState().updatePoint(point.id, {
              x: target.position.x,
              y: target.position.y,
              z: target.position.z,
            });
          }
          updateRouteLinesForWaypoint(
            ci,
            carMeshesRef.current[i],
            routePointMeshes[i],
            localLineArrRef.current[i]
          );
          useEditorStore
            .getState()
            .selectObjects([{ type: 'point', id: point?.id || '' }]);
          break;
        }
      }
    } catch (error) {
      console.error('objectChange error:', error);
    }
  };
}
