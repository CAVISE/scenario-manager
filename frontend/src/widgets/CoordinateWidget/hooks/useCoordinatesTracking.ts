import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import type { UseCoordinatesTrackingOptions } from '../types/CoordinateWidgetTypes';
import { GROUND_PLANE } from '../constants/coordinateWidgetConstants';
import { toNDC } from '../utils/coordinateHelpers';
import type { Vec3 } from '@/shared/types/sceneTypes';

export const useCoordinatesTracking = ({
  cameraRef,
  roadMeshRef,
}: UseCoordinatesTrackingOptions) => {
  const [coords, setCoords] = useState<Vec3 | null>(null);
  const [onMap, setOnMap] = useState(false);

  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const planeTarget = useRef(new THREE.Vector3());

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const { clientX, clientY } = e;

      const ndc = toNDC(clientX, clientY);
      mouse.current.x = ndc.x;
      mouse.current.y = ndc.y;

      const camera = cameraRef.current;
      const road = roadMeshRef.current;

      if (!camera) return;

      raycaster.current.setFromCamera(mouse.current, camera);

      if (road) {
        const hits = raycaster.current.intersectObject(road, true);
        if (hits.length > 0) {
          const point = hits[0].point;
          setCoords({ x: point.x, y: point.y, z: point.z });
          setOnMap(true);
          return;
        }
      }

      if (
        raycaster.current.ray.intersectPlane(GROUND_PLANE, planeTarget.current)
      ) {
        const point = planeTarget.current;
        setCoords({ x: point.x, y: point.y, z: 0 });
        setOnMap(false);
      }
    },
    [cameraRef, roadMeshRef]
  );

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  return { coords, onMap };
};
