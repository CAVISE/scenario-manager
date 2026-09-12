import { SelectedObject } from '@editor/types/editorTypes';
import * as THREE from 'three';
import { TransformControls } from 'three-stdlib';
export interface handleSelectProps {
  sceneRef: React.RefObject<THREE.Scene | undefined>;
  transformControlsRef: React.RefObject<TransformControls | null>;
  detachTransformControls: () => void;
  itemId: string;
  pointsArrRef: React.RefObject<THREE.Mesh[]>;
  selectObjects: (objs: SelectedObject[]) => void;
  onSelectObjects: (objs: SelectedObject[]) => void;
  carMeshesRef: React.RefObject<THREE.Mesh[]>;
  focusObject: (object: THREE.Object3D) => void;
}
