import { useEffect } from 'react';
import { useEditorStore } from '@/store';
import { useWorkspacePreferences } from '@/store/ui/useWorkspacePreferences';
import { getCarsNeedingRouteAlignment } from '../utils/routeOrientation';

export function useRouteOrientationSync() {
  const cars = useEditorStore((state) => state.cars);
  const points = useEditorStore((state) => state.points);
  const simulationRunning = useEditorStore(
    (state) => state.simulationSession.phase === 'running'
  );
  const alignVehiclesToRoute = useWorkspacePreferences(
    (state) => state.alignVehiclesToRoute
  );

  useEffect(() => {
    if (!alignVehiclesToRoute || simulationRunning) return;
    const store = useEditorStore.getState();
    getCarsNeedingRouteAlignment(cars, points).forEach(({ id, rotation }) => {
      store.updateCar(id, { rotation });
    });
  }, [alignVehiclesToRoute, cars, points, simulationRunning]);
}
