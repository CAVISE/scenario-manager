import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';

export function useBuildingLoader() {
  const buildingModelRef = useRef<THREE.Object3D | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(
      '/nyc_bronx_buildings.glb',
      (gltf) => {
        const model = gltf.scene;
        model.rotation.x = -Math.PI / 2;
        model.scale.setScalar(0.5);
        const box = new THREE.Box3().setFromObject(model);
        model.position.z -= box.min.z;
        model.position.z = -10000;
        model.rotation.x += Math.PI;
        buildingModelRef.current = model;
      },
      undefined,
      () => {
        const geo = new THREE.BoxGeometry(3, 30, 3);
        geo.translate(0, 0, 15);
        buildingModelRef.current = new THREE.Mesh(
          geo,
          new THREE.MeshBasicMaterial({ color: 0x666666 }),
        );
      },
    );
  }, []);

  return buildingModelRef;
}
