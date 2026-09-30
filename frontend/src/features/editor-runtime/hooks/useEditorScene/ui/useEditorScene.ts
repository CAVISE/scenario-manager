import { useCarMeshSync } from '../hooks/carFunctions';
import { useLidarMeshSync } from '../hooks/lidarFunction';
import { useMouseEvents } from '../../mouseEvents';
import { usePedestrianMeshSync } from '../hooks/pedestrianFunction';
import { useRSUMeshSync } from '../hooks/rsuFunction';
import { useBuildingMeshSync } from '../hooks/buildingFunction';

export function useEditorScene() {
  useCarMeshSync();
  usePedestrianMeshSync();
  useLidarMeshSync();
  useRSUMeshSync();
  useBuildingMeshSync();
  useMouseEvents();
}
