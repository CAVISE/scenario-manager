import { Pedestrian } from '../../../../../../store/types/useEditorStoreTypes';
import * as THREE from 'three';
export interface LoadPedestriansContext {
  scene: THREE.Scene;
  pedestrians: Pedestrian[];
  pedestrianMeshes: THREE.Mesh[];
  updateSceneGraph: () => void;
}
