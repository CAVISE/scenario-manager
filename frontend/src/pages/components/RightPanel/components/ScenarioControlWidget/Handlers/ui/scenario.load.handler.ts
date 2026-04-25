import * as THREE from 'three';
import { useEditorStore } from '../../../../../../../store';
import { ScenarioPayload } from '../../../../../../../api/types/IScenarioTypes';
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
    scenario_id: s.Scenario?.id || null,
    scenario_name: s.Scenario?.name || localStorage.getItem('scenario_name'),
    weather: s.Scenario?.weather || localStorage.getItem('weather'),
    map: s.simConfig?.carla?.map || 'town10',
    id: s.Scenario?.id || null,
    name_of_scenario: s.Scenario?.name || null,
    preview: canvas?.toDataURL('image/png') ?? null,
    scenario: [
      {
        vehicle: 'car',
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
            .map((p: Point, i: number) => ({ id: i, x: p.x, y: p.y, z: p.z })),
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
        vehicle: 'RSU',
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
        vehicle: 'building',
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
        vehicle: 'pedestrian',
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
    ],
  };
}

export interface LoadScenarioOptions {
  hasId: boolean;
  scenarioIdInput: string;
  sceneRef: React.RefObject<THREE.Scene | undefined>;
  setNotice: (value: string) => void;
  loadRSURef: React.RefObject<() => void>;
  updateSceneGraph: () => void;
  buildingModelRef: React.RefObject<THREE.Object3D | null>;
}
