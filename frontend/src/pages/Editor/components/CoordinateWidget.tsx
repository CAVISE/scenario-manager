import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CoordinatesWidgetProps } from './types/CoordinateWidgetTypes';
import { GROUND_PLANE } from './types/CoordinateWidgetTypes';


export function CoordinatesWidget({ getCameraRef, getRoadMesh }: CoordinatesWidgetProps) {
  const [coords, setCoords] = useState<{ x: number; y: number; z: number } | null>(null);
  const [onMap,  setOnMap]  = useState(false);
  const raycaster            = useRef(new THREE.Raycaster());
  const mouse                = useRef(new THREE.Vector2());
  const planeTarget          = useRef(new THREE.Vector3());

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouse.current.x =  (e.clientX / window.innerWidth)  * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;

      const camera = getCameraRef();
      const road   = getRoadMesh();
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
    <div style={{
      position:       'fixed',
      top:            '4em',
      right:          '310px',
      zIndex:         1000,
      background:     'rgba(0,0,0,0.55)',
      color:          onMap ? '#e0e0e0' : '#888',
      fontFamily:     'monospace',
      fontSize:       '12px',
      padding:        '4px 10px',
      borderRadius:   '6px',
      pointerEvents:  'none',
      backdropFilter: 'blur(4px)',
      border:         `1px solid ${onMap ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'}`,
      whiteSpace:     'nowrap',
      transition:     'color 0.2s, border-color 0.2s',
    }}>
      {coords
        ? <>X <b>{coords.x.toFixed(2)}</b> &nbsp; Y <b>{coords.y.toFixed(2)}</b> &nbsp; Z <b>{coords.z.toFixed(2)}</b></>
        : <span style={{ opacity: 0.5 }}>move cursor over map</span>
      }
    </div>
  );
}
