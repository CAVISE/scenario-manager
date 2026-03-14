import  * as THREE from 'three';
import { RSU } from '../../../../store/types/useEditorStoreTypes';
export interface LoadRSUContext {
  scene: THREE.Scene;
  RSUs: RSU[];
  points_arr: THREE.Mesh[];
  points_objs: THREE.Mesh[];
  isAddPointModeActive: boolean;
  updateSceneGraph: () => void;
}