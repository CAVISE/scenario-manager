import { useMemo } from 'react';
import { useEditorStore } from '@/store';

export function useSelectedObject() {
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const selectedObjects = useEditorStore((s) => s.selectedObjects);
  const selectedId = selectedIds[0];
  const selectedObject = selectedObjects[0];

  const car = useEditorStore(
    (s) => s.cars.find((c) => c.id === s.selectedIds[0]) ?? null
  );

  const lidars = useEditorStore((s) => s.lidars);

  const lidar = useMemo(
    () => lidars.find((l) => l.id === selectedId) ?? null,
    [lidars, selectedId]
  );

  const rsu = useEditorStore(
    (s) => s.RSUs.find((r) => r.id === s.selectedIds[0]) ?? null
  );

  const point = useEditorStore((s) =>
    s.selectedObjects[0]?.type === 'point'
      ? (s.points.find((p) => p.id === s.selectedObjects[0]!.id) ?? null)
      : null
  );

  const pedestrian = useEditorStore(
    (s) => s.pedestrians.find((p) => p.id === s.selectedIds[0]) ?? null
  );

  const building = useEditorStore((s) => {
    if (s.selectedIds[0]) {
      const b = s.buildings.find((x) => x.id === s.selectedIds[0]);
      if (b) return b;
    }
    if (
      !s.selectedIds[0] &&
      s.selectedObjects[0]?.type === 'building' &&
      s.selectedObjects[0].id
    ) {
      return s.buildings.find((x) => x.id === s.selectedObjects[0]!.id) ?? null;
    }
    return null;
  });

  const carLidars = useMemo(
    () => (car ? lidars.filter((l) => l.carId === car.id) : []),
    [lidars, car]
  );

  const isCar = !!car;
  const isLidar = !!lidar || selectedObject?.type === 'lidar';
  const isRSU = !!rsu;
  const isBuilding = !!building;
  const isPedestrian = !!pedestrian;

  const isCircle =
    !isCar &&
    !isLidar &&
    !isRSU &&
    !isBuilding &&
    !isPedestrian &&
    selectedObject?.type === 'point';

  const hasSelection =
    isCar || isRSU || isCircle || isBuilding || isLidar || isPedestrian;

  return {
    car,
    rsu,
    point,
    building,
    lidar,
    pedestrian,
    carLidars,
    isCar,
    isRSU,
    isCircle,
    isBuilding,
    isLidar,
    isPedestrian,
    hasSelection,
  };
}
