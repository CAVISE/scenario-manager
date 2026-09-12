import { useCarMeshSync } from './car';
import { useLidarMeshSync } from './lidar';
import { useMouseEvents } from '../mouseEvents';
import { usePedestrianMeshSync } from './pedestrianMeshSync';
import { useRSUMeshSync } from './rsu';

export function useEditorScene() {
  useCarMeshSync();
  usePedestrianMeshSync();
  useLidarMeshSync();
  useRSUMeshSync();
  useMouseEvents();
}
