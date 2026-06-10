import { useEditorStore } from '../../../../../../../store';
import { getMapFileReference } from '../../../../../../Editor/hooks/useThreeScene/hooks/useOdrLoader/utils/xodrRepository';
import {
  ScenarioGroup,
  ScenarioPayload,
} from '../../../../../../../api/types/IScenarioTypes';
import {
  Building,
  Car,
  Lidar,
  Pedestrian,
  Point,
  RSU,
} from '../../../../../../../store/types/useEditorStoreTypes';

export function buildScenarioPayload(): ScenarioPayload {
  const s = useEditorStore.getState();
  const canvas = document.querySelector(
    '#ThreeJS canvas',
  ) as HTMLCanvasElement | null;

  return {
    // Fields expected by the backend UploadScenarioRequest model:
    scenario_id: s.Scenario?.id || null,
<<<<<<< Updated upstream
    name_of_scenario: s.Scenario?.name?.trim() || null,
    description: s.Scenario?.description || null,
    preview: canvas?.toDataURL('image/png') ?? null,
    file_: getMapFileReference(s.simConfig?.carla?.map) ?? null,
=======
    scenario_name:
      s.Scenario?.name ?? localStorage.getItem('scenario_name') ?? undefined,
    weather:
      s.Scenario?.weather ?? localStorage.getItem('weather') ?? undefined,
    map: s.simConfig?.carla?.map || 'town10',
    id: s.Scenario?.id || null,
    name_of_scenario: s.Scenario?.name || null,
    preview: (() => {
      if (!canvas) return null;
      try {
        const thumb = document.createElement('canvas');
        thumb.width = 320;
        thumb.height = 180;
        const ctx = thumb.getContext('2d');
        if (!ctx) return null;
        const scale = Math.min(320 / canvas.width, 180 / canvas.height);
        const dx = (320 - canvas.width * scale) / 2;
        const dy = (180 - canvas.height * scale) / 2;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 320, 180);
        ctx.drawImage(
          canvas,
          dx,
          dy,
          canvas.width * scale,
          canvas.height * scale,
        );
        return thumb.toDataURL('image/jpeg', 0.72);
      } catch {
        return null;
      }
    })(),
    file_: localStorage.getItem('cached_xodr') ?? null,
>>>>>>> Stashed changes
    scenario: (
      [
        {
          vehicle: 'car' as const,
          path: s.cars.map((car: Car) => ({
            x: car.x,
            y: car.y,
            z: car.z,
            model: car.model,
            color: Number(`0x${car.color}`),
            scale: car.scale,
            rotation: Math.floor((car.rotation ?? 0) * 57.32),
            selected: car.id === s.selectedId,
            points: s.points
              .filter((p: Point) => p.carId === car.id)
              .map((p: Point, i: number) => ({
                id: i,
                x: p.x,
                y: p.y,
                z: p.z,
              })),
            lidars: s.lidars
              .filter((l: Lidar) => l.carId === car.id)
              .map((l: Lidar) => ({
                x: l.x,
                y: l.y,
                z: l.z,
                rotation: l.rotation,
                range: l.range,
                channels: l.channels,
                rotation_frequency: l.rotation_frequency,
              })),
          })),
        },
        {
          vehicle: 'RSU' as const,
          path: s.RSUs.map((r: RSU) => ({
            x: r.x,
            y: r.y,
            z: r.z,
            tx_power: r.tx_power,
            frequency: r.frequency,
            range: r.range,
            protocol: r.protocol,
            script: r.script || null,
          })),
        },
        {
          vehicle: 'building' as const,
          path: s.buildings.map((b: Building) => ({
            id: b.id,
            x: b.x,
            y: b.y,
            z: b.z,
            height: b.height,
            material: b.material,
          })),
        },
        {
          vehicle: 'pedestrian' as const,
          path: s.pedestrians.map((p: Pedestrian) => ({
            id: p.id,
            x: p.x,
            y: p.y,
            z: p.z,
            speed: p.speed,
            cross_factor: p.cross_factor,
            is_invincible: p.is_invincible,
            tx_power: p.tx_power,
            frequency: p.frequency,
            protocol: p.protocol,
            beacon_interval: p.beacon_interval,
          })),
        },
      ] as ScenarioGroup[]
    ).filter((g) => g.path.length > 0),
  };
}
