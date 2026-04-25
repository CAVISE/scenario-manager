import { useCarMeshSync } from '../hooks/carFunctions';
import { useLidarMeshSync } from '../hooks/lidarFunction';
import { useMouseEvents } from '../../mouseEvents';
import { usePedestrianMeshSync } from '../hooks/pedestrianFunction';
import { useRSUMeshSync } from '../hooks/rsuFunction';

export function useEditorScene() {
  useCarMeshSync();
  usePedestrianMeshSync();
  useLidarMeshSync();
  useRSUMeshSync();
  useMouseEvents();
}
