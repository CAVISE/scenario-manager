import * as THREE from 'three';
import { TransformControls } from 'three-stdlib';
import { SelectedObject } from '../../../../../types/PanelTypes';
export interface handleSelectProps {
  sceneRef: React.RefObject<THREE.Scene | undefined>;
  transformControlsRef: React.RefObject<TransformControls | undefined>;
  detachTransformControls: () => void;
  itemId: string;
  pointsArrRef: React.RefObject<THREE.Mesh[]>;
  selectObject: (obj: SelectedObject | null) => void;
  onSelectObject: (obj: SelectedObject) => void;
  carMeshesRef: React.RefObject<THREE.Mesh[]>;
}
