import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three-stdlib';


export function useCarModel() {
  const carModelRef  = useRef<THREE.Object3D>();
  const loaderRef    = useRef(new OBJLoader());
  const [modelLoaded, setModelLoaded] = useState(false);

  useEffect(() => {
    loaderRef.current.load(
      '/Car.obj',
      (obj) => {
        obj.rotation.x = Math.PI / 2;
        carModelRef.current = obj;
        setModelLoaded(true);
      },
      undefined,
      (err) => console.error('OBJ load error:', err)
    );
  }, []);

  return { carModelRef, modelLoaded };
}