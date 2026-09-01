import { buildScenarioPayload } from './scenario.load.handler';
import {
  validateDeletePayload,
  validateStartSimulationPayload,
  validateUpdatePayload,
} from '@/api/scenarioValidation';
import {
  BuildingPath,
  CarPath,
  PedestrianPath,
  RSUPath,
} from '../../types/ScenarioControlWidgetTypes';
import type { ScenarioGroup } from '../../types/ScenarioControlWidgetTypes';
import type { ScenarioGroup as ApiScenarioGroup } from '@/api/types/IScenarioTypes';
import { getApiErrorMessage } from '@/api/errors';
import { queryClient } from '@/api/queryClient';
import { scenariosApi } from '@/api/scenarios';
import { buildOpenCDAArtifact } from '@editor/Generators/opencdaArtifact';
import { defaultSimConfig } from '@editor/Generators/types/configGeneratorsTypes';
import {
  scenarioKeys,
  useScenarioCreateMutation,
  useScenarioPatchMutation,
  useScenarioDeleteMutation,
} from '@editor/hooks/useApiHooks/useScenarioQueries';
import { useStartSimulationMutation } from '@editor/hooks/useApiHooks/useSimulationMutation';
import { StartSimulationPayload } from '@editor/hooks/useApiHooks/useSimulationMutation/types/useSimulationMutationTypes';
import {
  isOpenDrive,
  fetchXodrText,
  resolveXodrTextForSimulation,
} from '@editor/hooks/useThreeScene/hooks/useOdrLoader/utils/xodrRepository';
import { useEditorStore } from '@/store';
import {
  Scenario,
  RSU,
  Building,
  Lidar,
  Point,
} from '@/store/types/useEditorStoreTypes';
import { LoadScenarioOptions } from '../types/scenario.load.handlerTypes';

export const handleLoad = async ({
  hasId,
  scenarioIdInput,
  setNotice,
  updateSceneGraph,
  loadFile,
  setStep,
}: LoadScenarioOptions) => {
  if (!hasId) return;
  setStep?.('map');
  try {
    const id = scenarioIdInput.trim();
    const data = await queryClient.fetchQuery({
      queryKey: scenarioKeys.detail(id),
      queryFn: () => scenariosApi.get(id),
    });
    useEditorStore.setState({ simConfig: defaultSimConfig });
    const s = useEditorStore.getState();
    s.updateScenario({
      id: data.scenario_id ?? '',
      name: data.scenario_name ?? data.name_of_scenario ?? '',
      weather: data.weather ?? '',
      description: data.description ?? '',
      file_: data.file_ ?? null,
    });
    const xodr = data.file_ ?? (data.scenario as unknown as Scenario)?.file_;
    if (xodr) {
      const xodrText = isOpenDrive(xodr) ? xodr : await fetchXodrText(xodr);

      loadFile(xodrText, true, isOpenDrive(xodr) ? undefined : xodr);
    }
    const rawScenario = data.scenario as unknown as {
      scenario_text: ScenarioGroup<
        CarPath | RSUPath | BuildingPath | PedestrianPath
      >[];
    };
    const scenarioText = rawScenario?.scenario_text;

    s.removeAllCars();
    s.removeAllRSUs();
    s.removeAllBuildings();
    s.removeAllPedestrians();

    const carGroup = scenarioText?.find((g) => g.vehicle === 'car') as
      ScenarioGroup<CarPath> | undefined;
    if (carGroup && carGroup.path.length > 0) {
      const carsToAdd = carGroup.path.map((car: CarPath) => ({
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
      }));
      const carIds = s.addCarsBatch(carsToAdd);

      const pointsToAdd: Omit<Point, 'id'>[] = [];
      const lidarsToAdd: Omit<Lidar, 'id'>[] = [];
      carGroup.path.forEach((car: CarPath, i: number) => {
        const carId = carIds[i];
        car.points?.forEach((pt) =>
          pointsToAdd.push({ carId, x: pt.x, y: pt.y, z: pt.z })
        );
        car.lidars?.forEach((l) =>
          lidarsToAdd.push({
            carId,
            x: l.x,
            y: l.y,
            z: l.z,
            rotation: l.rotation ?? 0,
            range: l.range ?? 50,
            channels: l.channels ?? 32,
            rotation_frequency: l.rotation_frequency ?? 10,
          })
        );
      });
      if (pointsToAdd.length > 0) s.addPointsBatch(pointsToAdd);
      if (lidarsToAdd.length > 0) s.addLidarsBatch(lidarsToAdd);
    }

    const rsuGroup = scenarioText?.find((g) => g.vehicle === 'RSU') as
      ScenarioGroup<RSUPath> | undefined;
    if (rsuGroup && rsuGroup.path.length > 0) {
      const rsusToAdd = rsuGroup.path.map((rsu: RSUPath) => ({
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
          lidar_dropoff_zero_intensity:
            rsu.opencda_lidar_dropoff_zero_intensity,
          lidar_noise_stddev: rsu.opencda_lidar_noise_stddev,
          localization_activate: rsu.opencda_localization_activate,
          gnss_noise_alt_stddev: rsu.opencda_gnss_noise_alt_stddev,
          gnss_noise_lat_stddev: rsu.opencda_gnss_noise_lat_stddev,
          gnss_noise_lon_stddev: rsu.opencda_gnss_noise_lon_stddev,
        },
      }));
      s.addRSUsBatch(rsusToAdd);
    }

    const pedGroup = scenarioText?.find((g) => g.vehicle === 'pedestrian') as
      ScenarioGroup<PedestrianPath> | undefined;
    if (pedGroup && pedGroup.path.length > 0) {
      const pedsToAdd = pedGroup.path.map((p: PedestrianPath) => ({
        x: p.x,
        y: p.y,
        z: p.z,
        speed: p.speed ?? 1.2,
        cross_factor: p.cross_factor ?? 0.5,
        is_invincible: p.is_invincible ?? false,
        tx_power: p.tx_power ?? 10,
        frequency: p.frequency ?? 5.9e9,
        protocol: (p.protocol as 'DSRC' | 'C-V2X' | undefined) ?? 'DSRC',
        beacon_interval: p.beacon_interval ?? 1000,
      }));
      s.addPedestriansBatch(pedsToAdd);
    }

    const bldGroup = scenarioText?.find((g) => g.vehicle === 'building') as
      ScenarioGroup<BuildingPath> | undefined;
    if (bldGroup && bldGroup.path.length > 0) {
      const buildingsToAdd = bldGroup.path.map((b: BuildingPath) => ({
        x: b.x,
        y: b.y,
        z: b.z,
        name: '',
        width: 20,
        depth: 20,
        height: b.height ?? 20,
        material:
          (b.material as Building['material'] | undefined) ?? 'concrete',
        scale: 0.5,
        rotation: 0,
      }));
      s.addBuildingsBatch(buildingsToAdd);
    }

    const meta = data.scenario as
      { scenario_id?: string; name_of_scenario?: string } | undefined;
    s.updateScenario({
      id: String(meta?.scenario_id ?? id),
      name: meta?.name_of_scenario ?? '',
    });
    updateSceneGraph();
    setNotice('The scenario has been uploaded.');
    if (!xodr) {
      setStep?.('done');
    }
  } catch (err) {
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

export const handleCreate = async (
  setNotice: (value: string) => void,
  createMutation: ReturnType<typeof useScenarioCreateMutation>,
  scenarioIdInput = '',
  onIdResolved?: (id: string) => void
) => {
  try {
    const payload = buildScenarioPayload();
    const trimmedId = scenarioIdInput.trim();

    const scenarioName = payload.name_of_scenario ?? payload.scenario_name;
    if (!scenarioName || !scenarioName.trim()) {
      setNotice('Scenario name is required.');
      return;
    }

    const data = await createMutation.mutateAsync({
      payload: {
        ...payload,
        scenario_id: trimmedId || payload.scenario_id,
      },
      scenarioIdInput: trimmedId,
    });

    const resolvedId =
      trimmedId ||
      payload.scenario_id?.trim() ||
      data?.scenario_id?.trim() ||
      '';

    if (resolvedId) {
      useEditorStore.getState().updateScenario({ id: resolvedId });
      onIdResolved?.(resolvedId);
    }
    setNotice('Scenario saved.');
  } catch (err) {
    console.error(err);
    setNotice(await getApiErrorMessage(err, 'Failed to save scenario.'));
  }
};

export const handlePatch = async (
  setNotice: (value: string) => void,
  scenarioIdInput: string,
  hasId: boolean,
  patchMutation: ReturnType<typeof useScenarioPatchMutation>
) => {
  if (!hasId) return;
  try {
    const id = scenarioIdInput.trim();
    const payload = buildScenarioPayload();
    const validation = validateUpdatePayload(id, payload);
    if (!validation.ok) {
      setNotice(validation.message);
      return;
    }
    await patchMutation.mutateAsync({
      id,
      payload,
    });
    setNotice('The scenario has been updated.');
  } catch (err) {
    console.error(err);
    setNotice(await getApiErrorMessage(err, 'Failed to update the scenario.'));
  }
};

export const handleDelete = async (
  setNotice: (value: string) => void,
  scenarioIdInput: string,
  hasId: boolean,
  deleteMutation: ReturnType<typeof useScenarioDeleteMutation>
) => {
  if (!hasId) return;
  try {
    const id = scenarioIdInput.trim();
    const validation = validateDeletePayload(id);
    if (!validation.ok) {
      setNotice(validation.message);
      return;
    }
    await deleteMutation.mutateAsync({
      id,
      payload: buildScenarioPayload(),
    });
    setNotice('The scenario has been deleted.');
  } catch (err) {
    console.error(err);
    setNotice(await getApiErrorMessage(err, 'Failed to delete scenario.'));
  }
};

export const handleRunSimulation = async (
  setNotice: (value: string) => void,
  scenarioIdInput: string,
  startMutation: ReturnType<typeof useStartSimulationMutation>,
  mapOffsets?: { x: number; y: number }
) => {
  const state = useEditorStore.getState();
  const scenario = state.Scenario;
  const map = state.simConfig?.carla?.map || 'Town10HD';
  const xodr = await resolveXodrTextForSimulation(map);

  const payload: StartSimulationPayload = {
    scenario_id: scenario.id || scenarioIdInput.trim() || '',
    scenario_name: scenario.name || 'Scenario',
    scenario: buildScenarioPayload().scenario as ApiScenarioGroup[],
    description: scenario.description || '',
    opencda_config_yaml: buildOpenCDAArtifact(state),
    map,
    xodr,
    max_ticks: useEditorStore.getState().simConfig?.max_ticks ?? 2000,
    map_offsets: mapOffsets,
    attacks: useEditorStore.getState().simConfig?.attacks ?? [],
  };

  try {
    const debugPayload = {
      ...payload,
      xodr: payload.xodr
        ? `<omitted, length=${payload.xodr.length}>`
        : undefined,
    } as unknown;

    console.debug('Start simulation payload (frontend):', debugPayload);
  } catch (e) {
    console.error('Failed to stringify start payload for debug', e);
  }

  const simulationValidation = validateStartSimulationPayload(payload);
  if (!simulationValidation.ok) {
    setNotice(simulationValidation.message);
    return;
  }

  startMutation.mutate(payload, {
    onSuccess: () => setNotice('The simulation has started.'),
    onError: async (err) => {
      console.error(err);
      setNotice(await getApiErrorMessage(err, 'Failed to start simulation.'));
    },
  });
};
