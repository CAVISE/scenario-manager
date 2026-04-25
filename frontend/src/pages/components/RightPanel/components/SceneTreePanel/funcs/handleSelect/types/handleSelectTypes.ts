import * as THREE from 'three';
import { SelectedObject } from '../../../../../../../../Editor/types/editorTypes';
import { TransformControls } from 'three-stdlib';
export interface handleSelectProps {
  sceneRef: React.MutableRefObject<THREE.Scene | undefined>;
  transformControlsRef: React.MutableRefObject<TransformControls | undefined>;
  detachTransformControls: () => void;
  itemId: string;
  pointsArrRef: React.MutableRefObject<THREE.Mesh[]>;
  selectObject: (obj: SelectedObject | null) => void;
  onSelectObject: (obj: SelectedObject) => void;
  carMeshesRef: React.MutableRefObject<THREE.Mesh[]>;
}
