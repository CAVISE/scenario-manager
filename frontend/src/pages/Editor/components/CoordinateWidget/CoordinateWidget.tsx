import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CoordinateWidgetActiveStyles, CoordinatesWidgetDeactiveStyles } from './types/CoordinateWidgetTypes';
import { GROUND_PLANE } from './types/CoordinateWidgetTypes';
import { useEditorRefs } from '../../context/EditorRefsContext';
import { Vec3 } from '../../types/editorTypes';


export function CoordinatesWidget() {
  const [coords, setCoords] = useState<Vec3 | null>(null);
  const [onMap,  setOnMap]  = useState(false);
  const raycaster            = useRef(new THREE.Raycaster());
  const mouse                = useRef(new THREE.Vector2());
  const planeTarget          = useRef(new THREE.Vector3());
  const {cameraRef, roadMeshRef} = useEditorRefs()
  useEffect(() => {

    const onMouseMove = (e: MouseEvent) => {
      mouse.current.x =  (e.clientX / window.innerWidth)  * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;

      const camera = cameraRef.current;
      const road   = roadMeshRef.current;
      if (!camera) return;

      raycaster.current.setFromCamera(mouse.current, camera);

      if (road) {
        const hits = raycaster.current.intersectObject(road, true);
        if (hits.length > 0) {
          const p = hits[0].point;
          setCoords({ x: p.x, y: p.y, z: p.z });
          setOnMap(true);
          return;
        }
      }

      if (raycaster.current.ray.intersectPlane(GROUND_PLANE, planeTarget.current)) {
        const p = planeTarget.current;
        setCoords({ x: p.x, y: p.y, z: 0 });
        setOnMap(false);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  return (
    <div style={onMap ? CoordinateWidgetActiveStyles : CoordinatesWidgetDeactiveStyles}>
      {coords
        ? <>X <b>{coords.x.toFixed(2)}</b> &nbsp; Y <b>{coords.y.toFixed(2)}</b> &nbsp; Z <b>{coords.z.toFixed(2)}</b></>
        : <span style={{ opacity: 0.5 }}>move cursor over map</span>
      }
    </div>
  );
}
