import { useEditorStore } from '@/store';
import { ScenarioGroup, ScenarioPayload } from '@/api/types/IScenarioTypes';
import {
  Building,
  Car,
  Lidar,
  Pedestrian,
  Point,
  RSU,
} from '@/store/types/useEditorStoreTypes';
import {
  DEFAULT_XODR,
  getCachedXodrContent,
} from '@editor/hooks/useThreeScene/hooks/useOdrLoader/utils/xodrRepository';

let canvasRef: HTMLCanvasElement | null = null;
let cachedPreview: string | null = null;
let previewGenerationInProgress = false;
let pendingPreviewCallbacks: Array<(preview: string | null) => void> = [];

export function setCanvasReference(canvas: HTMLCanvasElement | null): void {
  canvasRef = canvas;
  cachedPreview = null;
}

function capturePreview(): string | null {
  if (!canvasRef) return null;
  try {
    return canvasRef.toDataURL('image/png');
  } catch (error) {
    console.warn('Failed to capture preview:', error);
    return null;
  }
}

export function invalidatePreviewCache(): void {
  cachedPreview = null;
}

export function generatePreviewAsync(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!canvasRef) {
      resolve(null);
      return;
    }

    if (cachedPreview) {
      resolve(cachedPreview);
      return;
    }

    if (previewGenerationInProgress) {
      pendingPreviewCallbacks.push(resolve);
      return;
    }

    previewGenerationInProgress = true;

    requestAnimationFrame(() => {
      try {
        const preview = capturePreview();
        if (preview) {
          cachedPreview = preview;
        }
        resolve(preview);

        const callbacks = [...pendingPreviewCallbacks];
        pendingPreviewCallbacks = [];
        callbacks.forEach((cb) => cb(preview));
      } catch (error) {
        console.warn('Failed to generate preview:', error);
        resolve(null);

        const callbacks = [...pendingPreviewCallbacks];
        pendingPreviewCallbacks = [];
        callbacks.forEach((cb) => cb(null));
      } finally {
        previewGenerationInProgress = false;
      }
    });
  });
}

export function generatePreviewSync(): string | null {
  if (!canvasRef) {
    console.warn('No canvas reference set, cannot generate preview');
    return null;
  }

  if (cachedPreview) {
    return cachedPreview;
  }

  try {
    const preview = capturePreview();
    if (preview) {
      cachedPreview = preview;
      return preview;
    }
    return null;
  } catch (error) {
    console.warn('Failed to generate preview:', error);
    return null;
  }
}

export function buildScenarioPayload(): ScenarioPayload {
  const s = useEditorStore.getState();
  const preview = generatePreviewSync();

  return {
    scenario_id: s.Scenario?.id || null,
    scenario_name: s.Scenario?.name || null,
    weather: s.Scenario?.weather || undefined,
    map: s.simConfig?.carla?.map || DEFAULT_XODR,
    id: s.Scenario?.id || null,
    name_of_scenario: s.Scenario?.name || null,
    description: s.Scenario?.description || null,
    preview: preview,
    file_: getCachedXodrContent(),
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
            opencda_max_speed: car.opencda_max_speed,
            opencda_ignore_traffic_light: car.opencda_ignore_traffic_light,
            opencda_overtake_allowed: car.opencda_overtake_allowed,
            opencda_collision_time_ahead: car.opencda_collision_time_ahead,
            opencda_local_planner_debug: car.opencda_local_planner_debug,
            opencda_local_planner_debug_trajectory:
              car.opencda_local_planner_debug_trajectory,
            opencda_v2x_enabled: car.opencda_v2x?.enabled,
            opencda_v2x_communication_range:
              car.opencda_v2x?.communication_range,
            opencda_carla_model: car.opencda_carla_model,
            opencda_color: car.opencda_color,
            sumo_depart: car.sumo_depart,
            sumo_depart_lane: car.sumo_depart_lane,
            sumo_depart_pos: car.sumo_depart_pos,
            sumo_max_speed: car.sumo_max_speed,
            sumo_edges: car.sumo_edges,
            sumo_vtype: car.sumo_vtype,
            sumo_stop: car.sumo_stop,
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
            beacon_interval: r.beacon_interval,
            opencda_name: r.opencda_name,
            opencda_id: r.opencda_id,
            opencda_color: r.opencda_color,
            opencda_behavior_services: r.opencda_behavior_services,
            scenario: r.scenario || null,
            opencda_perception_activate: r.opencda_sensing?.perception_activate,
            opencda_detection_range: r.opencda_sensing?.detection_range,
            opencda_camera_visualize: r.opencda_sensing?.camera_visualize,
            opencda_camera_num: r.opencda_sensing?.camera_num,
            opencda_camera_positions: r.opencda_sensing?.camera_positions,
            opencda_lidar_visualize: r.opencda_sensing?.lidar_visualize,
            opencda_lidar_channels: r.opencda_sensing?.lidar_channels,
            opencda_lidar_range: r.opencda_sensing?.lidar_range,
            opencda_lidar_points_per_second:
              r.opencda_sensing?.lidar_points_per_second,
            opencda_lidar_rotation_frequency:
              r.opencda_sensing?.lidar_rotation_frequency,
            opencda_lidar_upper_fov: r.opencda_sensing?.lidar_upper_fov,
            opencda_lidar_lower_fov: r.opencda_sensing?.lidar_lower_fov,
            opencda_lidar_dropoff_general_rate:
              r.opencda_sensing?.lidar_dropoff_general_rate,
            opencda_lidar_dropoff_intensity_limit:
              r.opencda_sensing?.lidar_dropoff_intensity_limit,
            opencda_lidar_dropoff_zero_intensity:
              r.opencda_sensing?.lidar_dropoff_zero_intensity,
            opencda_lidar_noise_stddev: r.opencda_sensing?.lidar_noise_stddev,
            opencda_localization_activate:
              r.opencda_sensing?.localization_activate,
            opencda_gnss_noise_alt_stddev:
              r.opencda_sensing?.gnss_noise_alt_stddev,
            opencda_gnss_noise_lat_stddev:
              r.opencda_sensing?.gnss_noise_lat_stddev,
            opencda_gnss_noise_lon_stddev:
              r.opencda_sensing?.gnss_noise_lon_stddev,
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
