import type { Lidar } from '../../../../store/useEditorStore';
import * as THREE from 'three';
import { TransformControls } from 'three-stdlib';

export interface UseLidarMeshSyncParams {
  lidars:              Lidar[];
  cars:                { id: string }[];
  carMeshesRef:        React.MutableRefObject<THREE.Mesh[]>;
  transformControlsRef:React.MutableRefObject<TransformControls | null>;
  onSelect:            (lidarId: string) => void;
  updateSceneGraph: ()=> void
}