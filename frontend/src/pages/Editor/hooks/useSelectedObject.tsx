import { useMemo } from 'react';
import { useEditorStore } from "../../../store/useEditorStore";
import type { RightPanelProps } from "../../components/Statuses/RightPanel/types/PanelTypes";

export function useSelectedObject(selectedObject: RightPanelProps['selectedObject']) {
  const selectedId = useEditorStore(s => s.selectedId);
  const cars       = useEditorStore(s => s.cars);
  const RSUs       = useEditorStore(s => s.RSUs);
  const buildings  = useEditorStore(s => s.buildings);
  const lidars     = useEditorStore(s => s.lidars);

  const car = useMemo(
    () => cars.find(c => c.id === selectedId) ?? null,
    [cars, selectedId],
  );

  const lidar = useMemo(
    () => lidars.find(l => l.id === selectedId) ?? null,
    [lidars, selectedId],
  );

  const rsu = useMemo(
    () => RSUs.find(r => r.id === selectedId) ?? null,
    [RSUs, selectedId],
  );

  const building = useMemo(
    () =>
      selectedObject?.type === "building"
        ? buildings.find(b => b.id === selectedObject.id) ?? null
        : null,
    [buildings, selectedObject],
  );

  const carLidars = useMemo(
    () => (car ? lidars.filter(l => l.carId === car.id) : []),
    [lidars, car],
  );

  const isCar      = !!car;
  const isLidar = !!lidar || selectedObject?.type === 'lidar';
  const isRSU      = !!rsu;
  const isBuilding = !!building;
  const isCircle   = !isCar && !isLidar && !isRSU && !isBuilding &&
                     (selectedObject?.type === 'point');
  const hasSelection = isCar || isRSU || isCircle || isBuilding || isLidar;
  return {
    car, rsu, building, lidar, carLidars,
    isCar, isRSU, isCircle, isBuilding, isLidar, hasSelection,
  };
}
