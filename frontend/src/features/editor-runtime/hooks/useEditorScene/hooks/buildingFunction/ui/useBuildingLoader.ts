import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';

export function useBuildingLoader() {
  const buildingModelRef = useRef<THREE.Object3D | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(
      '/skyscraper.glb',
      (gltf) => {
        const model = gltf.scene;
        model.rotation.set(Math.PI / 2, 0, 0);
        model.position.set(0, 0, 0);
        buildingModelRef.current = model;
      },
      undefined,
      () => {
        const geo = new THREE.BoxGeometry(3, 30, 3);
        geo.translate(0, 0, 15);
        buildingModelRef.current = new THREE.Mesh(
          geo,
          new THREE.MeshBasicMaterial({ color: 0x666666 })
        );
      }
    );
  }, []);

  return buildingModelRef;
}
