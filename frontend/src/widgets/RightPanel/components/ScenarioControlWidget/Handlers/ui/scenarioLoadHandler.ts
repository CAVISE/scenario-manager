import {
  BuildingPath,
  CarPath,
  PedestrianPath,
  RSUPath,
} from '../../types/ScenarioControlWidgetTypes';
import type { ScenarioGroup } from '../../types/ScenarioControlWidgetTypes';
import { getApiErrorMessage } from '@/api/errors';
import { queryClient } from '@/api/queryClient';
import { scenariosApi } from '@/api/scenarios';
import { defaultSimConfig } from '@scenario-export';
import { scenarioKeys } from '@editor/hooks/useApiHooks/useScenarioQueries';
import {
  fetchXodrText,
  isOpenDrive,
} from '@editor/hooks/useThreeScene/hooks/useOdrLoader/utils/xodrRepository';
import { setStoredXodrName } from '@editor/hooks/useThreeScene/hooks/useOdrLoader/utils/xodrRepository';
import { useEditorStore } from '@/store';
import type { Scenario } from '@/entities/scenario';
import type { Building } from '@/entities/building';
import type { Lidar, Point } from '@/entities/vehicle';
import type { RSU } from '@/entities/roadside-unit';
import { toCarlaMapNameFromXodr } from '@/features/simulation-config';
import { beginMapLoadRequest } from '@editor/lib/mapLoadRequest';

import type { LoadScenarioOptions } from '../types/scenario.load.handlerTypes';

type ScenarioText = ScenarioGroup<
  CarPath | RSUPath | BuildingPath | PedestrianPath
>[];

export const handleLoad = async ({
  hasId,
  scenarioIdInput,
  setNotice,
  updateSceneGraph,
  loadFile,
  setStep,
  isCurrent: isCallerCurrent,
}: LoadScenarioOptions) => {
  if (!hasId) return;
  const isMapLoadCurrent = beginMapLoadRequest();
  const isCurrent = () => isMapLoadCurrent() && (isCallerCurrent?.() ?? true);
  setStep?.('map');
  try {
    const id = scenarioIdInput.trim();
    const data = await queryClient.fetchQuery({
      queryKey: scenarioKeys.detail(id),
      queryFn: () => scenariosApi.get(id),
    });
    if (!isCurrent()) return;
    useEditorStore.setState({ simConfig: defaultSimConfig });
    const state = useEditorStore.getState();
    state.updateScenario({
      id: data.scenario_id ?? '',
      name: data.scenario_name ?? data.name_of_scenario ?? '',
      weather: data.weather ?? '',
      description: data.description ?? '',
      file_: data.file_ ?? null,
      revision: data.revision,
    });
    const xodr = data.file_ ?? (data.scenario as unknown as Scenario)?.file_;
    const map =
      data.map ||
      (xodr && !isOpenDrive(xodr) ? toCarlaMapNameFromXodr(xodr) : null);
    if (map) {
      state.updateSimConfigCarla({ map });
      setStoredXodrName(map);
    }
    if (xodr) {
      const text = isOpenDrive(xodr) ? xodr : await fetchXodrText(xodr);
      if (!isCurrent()) return;
      loadFile(text, true, isOpenDrive(xodr) ? undefined : xodr);
    }

    const scenarioText = (
      data.scenario as unknown as { scenario_text: ScenarioText }
    )?.scenario_text;
    state.removeAllCars();
    state.removeAllRSUs();
    state.removeAllBuildings();
    state.removeAllPedestrians();
    restoreCars(scenarioText, state);
    restoreRsus(scenarioText, state);
    restorePedestrians(scenarioText, state);
    restoreBuildings(scenarioText, state);

    const meta = data.scenario as
      { scenario_id?: string; name_of_scenario?: string } | undefined;
    state.updateScenario({
      id: String(meta?.scenario_id ?? id),
      name: meta?.name_of_scenario ?? '',
    });
    updateSceneGraph();
    setNotice('The scenario has been uploaded.');
    if (!xodr) setStep?.('done');
  } catch (err) {
    if (!isCurrent()) return;
    console.error(err);
    setStep?.('done');
    if (
      err instanceof Error &&
      err.message.includes('Failed to render buildings')
    ) {
      console.error('[handleLoad] Building rendering error:', err);
    } else {
      setNotice(await getApiErrorMessage(err, 'Failed to load scenario.'));
    }
  }
};

type EditorState = ReturnType<typeof useEditorStore.getState>;

function restoreCars(
  scenarioText: ScenarioText | undefined,
  state: EditorState
) {
  const group = scenarioText?.find((item) => item.vehicle === 'car') as
    ScenarioGroup<CarPath> | undefined;
  if (!group?.path.length) return;
  const ids = state.addCarsBatch(
    group.path.map((car) => ({
      x: car.x,
      y: car.y,
      z: car.z,
      model: car.model ?? 'car',
      color: car.color?.toString(16).padStart(6, '0') ?? '00ff00',
      speed: 60,
      scale: car.scale ?? 1,
      rotation: (car.rotation ?? 0) / 57.32,
      sumo_depart: car.sumo_depart,
      sumo_depart_lane: car.sumo_depart_lane,
      sumo_depart_pos: car.sumo_depart_pos,
      sumo_max_speed: car.sumo_max_speed,
      sumo_edges: car.sumo_edges,
      sumo_vtype: car.sumo_vtype,
      sumo_stop: car.sumo_stop,
    }))
  );
  const points: Omit<Point, 'id'>[] = [];
  const lidars: Omit<Lidar, 'id'>[] = [];
  group.path.forEach((car, index) => {
    const carId = ids[index];
    car.points?.forEach((point) =>
      points.push({ carId, x: point.x, y: point.y, z: point.z })
    );
    car.lidars?.forEach((lidar) =>
      lidars.push({
        carId,
        x: lidar.x,
        y: lidar.y,
        z: lidar.z,
        rotation: lidar.rotation ?? 0,
        range: lidar.range ?? 50,
        channels: lidar.channels ?? 32,
        rotation_frequency: lidar.rotation_frequency ?? 10,
      })
    );
  });
  if (points.length) state.addPointsBatch(points);
  if (lidars.length) state.addLidarsBatch(lidars);
}

function restoreRsus(
  scenarioText: ScenarioText | undefined,
  state: EditorState
) {
  const group = scenarioText?.find((item) => item.vehicle === 'RSU') as
    ScenarioGroup<RSUPath> | undefined;
  if (!group?.path.length) return;
  state.addRSUsBatch(
    group.path.map((rsu) => ({
      name: '',
      x: rsu.x,
      y: rsu.y,
      z: rsu.z,
      tx_power: rsu.tx_power ?? 23,
      frequency: rsu.frequency ?? 5.9e9,
      range: rsu.range ?? 500,
      protocol: (rsu.protocol as RSU['protocol'] | undefined) ?? 'ITS-G5',
      network_protocol: 'GeoNetworking' as const,
      antenna_type: 'isotropic' as const,
      antenna_height: 5,
      antenna_gain: 0,
      polarization: 'vertical' as const,
      mimo_rows: 1,
      mimo_columns: 1,
      element_spacing: 0.5,
      azimuth: 0,
      tilt: 0,
      cam_interval: 100,
      scenario: rsu.scenario ?? '',
      beacon_interval: rsu.beacon_interval ?? 1000,
      opencda_name: rsu.opencda_name,
      opencda_id: rsu.opencda_id,
      opencda_color: rsu.opencda_color,
      opencda_behavior_services: rsu.opencda_behavior_services,
      opencda_sensing: {
        perception_activate: rsu.opencda_perception_activate,
        detection_range: rsu.opencda_detection_range,
        camera_visualize: rsu.opencda_camera_visualize,
        camera_num: rsu.opencda_camera_num,
        camera_positions: rsu.opencda_camera_positions,
        lidar_visualize: rsu.opencda_lidar_visualize,
        lidar_channels: rsu.opencda_lidar_channels,
        lidar_range: rsu.opencda_lidar_range,
        lidar_points_per_second: rsu.opencda_lidar_points_per_second,
        lidar_rotation_frequency: rsu.opencda_lidar_rotation_frequency,
        lidar_upper_fov: rsu.opencda_lidar_upper_fov,
        lidar_lower_fov: rsu.opencda_lidar_lower_fov,
        lidar_dropoff_general_rate: rsu.opencda_lidar_dropoff_general_rate,
        lidar_dropoff_intensity_limit:
          rsu.opencda_lidar_dropoff_intensity_limit,
        lidar_dropoff_zero_intensity: rsu.opencda_lidar_dropoff_zero_intensity,
        lidar_noise_stddev: rsu.opencda_lidar_noise_stddev,
        localization_activate: rsu.opencda_localization_activate,
        gnss_noise_alt_stddev: rsu.opencda_gnss_noise_alt_stddev,
        gnss_noise_lat_stddev: rsu.opencda_gnss_noise_lat_stddev,
        gnss_noise_lon_stddev: rsu.opencda_gnss_noise_lon_stddev,
      },
    }))
  );
}

function restorePedestrians(
  scenarioText: ScenarioText | undefined,
  state: EditorState
) {
  const group = scenarioText?.find((item) => item.vehicle === 'pedestrian') as
    ScenarioGroup<PedestrianPath> | undefined;
  if (!group?.path.length) return;
  state.addPedestriansBatch(
    group.path.map((pedestrian) => ({
      x: pedestrian.x,
      y: pedestrian.y,
      z: pedestrian.z,
      speed: pedestrian.speed ?? 1.2,
      cross_factor: pedestrian.cross_factor ?? 0.5,
      is_invincible: pedestrian.is_invincible ?? false,
      tx_power: pedestrian.tx_power ?? 10,
      frequency: pedestrian.frequency ?? 5.9e9,
      protocol: (pedestrian.protocol as 'DSRC' | 'C-V2X' | undefined) ?? 'DSRC',
      beacon_interval: pedestrian.beacon_interval ?? 1000,
    }))
  );
}

function restoreBuildings(
  scenarioText: ScenarioText | undefined,
  state: EditorState
) {
  const group = scenarioText?.find((item) => item.vehicle === 'building') as
    ScenarioGroup<BuildingPath> | undefined;
  if (!group?.path.length) return;
  state.addBuildingsBatch(
    group.path.map((building) => ({
      x: building.x,
      y: building.y,
      z: building.z,
      name: '',
      width: 20,
      depth: 20,
      height: building.height ?? 20,
      material:
        (building.material as Building['material'] | undefined) ?? 'concrete',
      scale: 0.5,
      rotation: 0,
    }))
  );
}
