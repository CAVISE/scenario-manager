import { GLTFLoader } from 'three-stdlib';
import * as THREE from 'three';
export const loader = new GLTFLoader();
export let buildingModel: THREE.Object3D | null = null;
export let buildingModelPromise: Promise<boolean> | null = null;

export function ensureBuildingModel(): Promise<boolean> {
  if (buildingModel) return Promise.resolve(true);
  if (buildingModelPromise) return buildingModelPromise;
  buildingModelPromise = new Promise((resolve) => {
    loader.load(
      '/nyc_bronx_buildings.glb',
      (gltf) => {
        buildingModel = gltf.scene;
        buildingModel.rotation.x = -Math.PI / 2;
        buildingModel.scale.setScalar(0.5);
        const box = new THREE.Box3().setFromObject(buildingModel);
        buildingModel.position.z -= box.min.z;
        buildingModel.position.z = -10000;
        buildingModel.rotation.x += Math.PI;
        resolve(true);
      },
      undefined,
      () => {
        const geometry = new THREE.BoxGeometry(20, 20, 20);
        const material = new THREE.MeshBasicMaterial({ color: 0x666666 });
        buildingModel = new THREE.Mesh(geometry, material);
        resolve(true);
      },
    );
  });
  return buildingModelPromise;
}
