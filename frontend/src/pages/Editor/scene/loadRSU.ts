import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import type { LoadRSUContext } from './types/loadRSUTypes';
const loader = new GLTFLoader();
let rsuModel: THREE.Object3D | null = null;

loader.load('/pedestrian_traffic_light.glb', (gltf) => {
  rsuModel = gltf.scene;
});

export function loadRSU(ctx: LoadRSUContext): {
  points_arr: THREE.Mesh[];
  points_objs: THREE.Mesh[];
  isAddPointModeActive: boolean;
} {
  const { scene, RSUs, updateSceneGraph } = ctx;

  const toRemove = scene.children.filter(c => c.userData.type === 'point');
  toRemove.forEach(obj => {
    scene.remove(obj);
    obj.traverse(child => {
      const m = child as THREE.Mesh;
      if (m.isMesh) {
        m.geometry?.dispose();
        (Array.isArray(m.material) ? m.material : [m.material]).forEach(mt => mt?.dispose());
      }
    });
  });
  const points_arr: THREE.Mesh[] = [];
  const points_objs: THREE.Mesh[] = [];

  RSUs.forEach((rsu) => {
    let obj: THREE.Object3D;

    if (rsuModel) {
      obj = rsuModel.clone(true);
      obj.scale.setScalar(0.05);
      obj.rotation.x += Math.PI / 2;
      obj.userData.type = 'point';
      obj.userData.id = rsu.id;
    } else {
      const geometry = new THREE.BoxGeometry(5, 5, 5);
      const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
      obj = new THREE.Mesh(geometry, material);
    }

    obj.userData = { type: 'point', id: rsu.id };
    obj.position.set(rsu.x, rsu.y, rsu.z);

    scene.add(obj);
    points_objs.push(obj as THREE.Mesh);
    points_arr.push(obj as THREE.Mesh);
  });

  updateSceneGraph();

  return { points_arr, points_objs, isAddPointModeActive: false };
}
