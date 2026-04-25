import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import { LoadPedestriansContext } from '../types/loadPedesrtianTypes';

const loader = new GLTFLoader();
let pedestrianModel: THREE.Object3D | null = null;

loader.load(
  '/pedestrian_traffic_light.glb',
  (gltf) => {
    pedestrianModel = gltf.scene;
  },
  undefined,
  () => {},
);

export function loadPedestrian(ctx: LoadPedestriansContext): {
  pedestrianMeshes: THREE.Mesh[];
} {
  const {
    scene,
    pedestrians,
    pedestrianMeshes: existingMeshes,
    updateSceneGraph,
  } = ctx;

  existingMeshes.forEach((mesh) => {
    mesh.traverse((child) => {
      const m = child as THREE.Mesh;
      if (m.isMesh) {
        m.geometry?.dispose();
        (Array.isArray(m.material) ? m.material : [m.material]).forEach((mt) =>
          mt?.dispose(),
        );
      }
    });
    scene.remove(mesh);
  });

  const pedestrianMeshes: THREE.Mesh[] = [];

  pedestrians.forEach((ped) => {
    let obj: THREE.Object3D;

    if (pedestrianModel) {
      obj = pedestrianModel.clone(true);
      obj.scale.setScalar(0.01);
      obj.rotation.x += Math.PI / 2;
    } else {
      const geometry = new THREE.BoxGeometry(0.5, 0.5, 1.5);
      geometry.translate(0, 0, 0.75);
      const material = new THREE.MeshBasicMaterial({ color: 0x888888 });
      obj = new THREE.Mesh(geometry, material);
    }

    obj.userData = { type: 'pedestrian', id: ped.id };
    obj.position.set(ped.x, ped.y, ped.z ?? 0);

    scene.add(obj);
    pedestrianMeshes.push(obj as THREE.Mesh);
  });

  updateSceneGraph();

  return { pedestrianMeshes };
}
