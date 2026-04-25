import { useMemo } from 'react';
import { useEditorStore } from '../../../../../../store';

export function useSelectedObject() {
  const selectedId = useEditorStore((s) => s.selectedId);
  const selectedObject = useEditorStore((s) => s.selectedObject);
  const cars = useEditorStore((s) => s.cars);
  const RSUs = useEditorStore((s) => s.RSUs);
  const buildings = useEditorStore((s) => s.buildings);
  const lidars = useEditorStore((s) => s.lidars);
  const pedestrians = useEditorStore((s) => s.pedestrians);
  const points = useEditorStore((s) => s.points);

  const car = useMemo(
    () => cars.find((c) => c.id === selectedId) ?? null,
    [cars, selectedId],
  );

  const lidar = useMemo(
    () => lidars.find((l) => l.id === selectedId) ?? null,
    [lidars, selectedId],
  );

  const rsu = useMemo(
    () => RSUs.find((r) => r.id === selectedId) ?? null,
    [RSUs, selectedId],
  );
  const point = useMemo(() => {
    return selectedObject?.type === 'point'
      ? (points.find((p) => p.id === selectedObject.id) ?? null)
      : null;
  }, [points, selectedObject]);

  const pedestrian = useMemo(
    () => pedestrians.find((p) => p.id === selectedId) ?? null,
    [pedestrians, selectedId],
  );

  const building = useMemo(() => {
    if (selectedId) {
      const b = buildings.find((x) => x.id === selectedId);
      if (b) return b;
    }
    if (
      !selectedId &&
      selectedObject?.type === 'building' &&
      selectedObject.id
    ) {
      return buildings.find((x) => x.id === selectedObject.id) ?? null;
    }
    return null;
  }, [buildings, selectedId, selectedObject]);

  const carLidars = useMemo(
    () => (car ? lidars.filter((l) => l.carId === car.id) : []),
    [lidars, car],
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
