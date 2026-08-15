import { buildScenarioPayload } from './scenario.load.handler';
import {
  validateDeletePayload,
  validateStartSimulationPayload,
  validateUpdatePayload,
} from '../../../../../../../api/scenarioValidation';
import {
  BuildingPath,
  CarPath,
  PedestrianPath,
  RSUPath,
} from '../../types/ScenarioControlWidgetTypes';
import type { ScenarioGroup } from '../../types/ScenarioControlWidgetTypes';
import type { ScenarioGroup as ApiScenarioGroup } from '../../../../../../../api/types/IScenarioTypes';

import { queryClient } from '../../../../../../../api/queryClient';
import {
  scenarioKeys,
  useScenarioCreateMutation,
  useScenarioPatchMutation,
  useScenarioDeleteMutation,
} from '../../../../../../Editor/hooks/useApiHooks/useScenarioQueries';
import { scenariosApi } from '../../../../../../../api/scenarios';
import { useEditorStore } from '../../../../../../../store';
import { useStartSimulationMutation } from '../../../../../../Editor/hooks/useApiHooks/useSimulationMutation';
import {
  Building,
  RSU,
  Scenario,
} from '../../../../../../../store/types/useEditorStoreTypes';
import { StartSimulationPayload } from '../../../../../../Editor/hooks/useApiHooks/useSimulationMutation/types/useSimulationMutationTypes';
import { getApiErrorMessage } from '../../../../../../../api/errors';
import { LoadScenarioOptions } from '../types/scenario.load.handlerTypes';
import {
  fetchXodrText,
  isOpenDrive,
  resolveXodrTextForSimulation,
  setStoredXodrName,
} from '../../../../../../Editor/hooks/useThreeScene/hooks/useOdrLoader/utils/xodrRepository';
import { buildOpenCDAArtifact } from '../../../../../../Editor/Generators/configGenerators';
import { defaultSimConfig } from '../../../../../../Editor/Generators/types/configGeneratorsTypes';

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
      if (!isOpenDrive(xodr)) setStoredXodrName(xodr);
      loadFile(xodrText, true);
    }
    const rawScenario = data.scenario as unknown as {
      scenario_text: ScenarioGroup<
        CarPath | RSUPath | BuildingPath | PedestrianPath
      >[];
    };
    const scenarioText = rawScenario?.scenario_text;

    [...s.cars].forEach((c) => s.removeCar(c.id));
    s.removeAllRSUs();
    [...s.points].forEach((p) => s.removePoint(p.id));
    [...s.buildings].forEach((b) => s.removeBuilding(b.id));
    [...s.pedestrians].forEach((p) => s.removePedestrian(p.id));

    const carGroup = scenarioText?.find((g) => g.vehicle === 'car') as
      ScenarioGroup<CarPath> | undefined;
    if (carGroup) {
      carGroup.path.forEach((car: CarPath) => {
        const carId = s.addCar(
          car.x,
          car.y,
          car.z,
          car.model ?? 'car',
          car.color?.toString(16).padStart(6, '0') ?? '00ff00',
          60,
        );
        s.updateCar(carId, {
          scale: car.scale ?? 1,
          rotation: (car.rotation ?? 0) / 57.32,
          sumo_depart: car.sumo_depart,
          sumo_depart_lane: car.sumo_depart_lane,
          sumo_depart_pos: car.sumo_depart_pos,
          sumo_max_speed: car.sumo_max_speed,
          sumo_edges: car.sumo_edges,
          sumo_vtype: car.sumo_vtype,
          sumo_stop: car.sumo_stop,
        });
        car.points?.forEach((pt) => s.addPoint(carId, pt.x, pt.y, pt.z));
        car.lidars?.forEach((l) => {
          s.addLidar(carId, l.x, l.y, l.z);
          const lidars = useEditorStore.getState().lidars;
          const last = lidars[lidars.length - 1];
          if (last)
            s.updateLidar(last.id, {
              rotation: l.rotation,
              range: l.range,
              channels: l.channels,
              rotation_frequency: l.rotation_frequency,
            });
        });
      });
    }

    const rsuGroup = scenarioText?.find((g) => g.vehicle === 'RSU') as
      ScenarioGroup<RSUPath> | undefined;
    if (rsuGroup) {
      rsuGroup.path.forEach((rsu: RSUPath) => {
        s.addRSU(rsu.x, rsu.y, rsu.z);
        const RSUs = useEditorStore.getState().RSUs;
        const added = RSUs[RSUs.length - 1];
        if (added)
          s.updateRSU(added.id, {
            tx_power: rsu.tx_power,
            frequency: rsu.frequency,
            range: rsu.range,
            protocol: rsu.protocol as RSU['protocol'] | undefined,
            scenario: rsu.scenario ?? '',
            beacon_interval: rsu.beacon_interval,
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
              lidar_dropoff_general_rate:
                rsu.opencda_lidar_dropoff_general_rate,
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
          });
      });
    }

    const pedGroup = scenarioText?.find((g) => g.vehicle === 'pedestrian') as
      ScenarioGroup<PedestrianPath> | undefined;
    if (pedGroup) {
      pedGroup.path.forEach((p: PedestrianPath) => {
        const pedId = s.addPedestrian(p.x, p.y, p.z);
        s.updatePedestrian(pedId, {
          speed: p.speed,
          cross_factor: p.cross_factor,
          is_invincible: p.is_invincible,
          tx_power: p.tx_power,
          frequency: p.frequency,
          protocol: p.protocol as 'DSRC' | 'C-V2X' | undefined,
          beacon_interval: p.beacon_interval,
        });
      });
    }

    const bldGroup = scenarioText?.find((g) => g.vehicle === 'building') as
      ScenarioGroup<BuildingPath> | undefined;
    if (bldGroup) {
      bldGroup.path.forEach((b: BuildingPath) => {
        const buildingId = s.addBuilding(b.x, b.y, b.z);
        s.updateBuilding(buildingId, {
          height: b.height,
          material: b.material as Building['material'] | undefined,
        });
      });
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
  onIdResolved?: (id: string) => void,
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
  patchMutation: ReturnType<typeof useScenarioPatchMutation>,
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
  deleteMutation: ReturnType<typeof useScenarioDeleteMutation>,
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
  mapOffsets?: { x: number; y: number },
) => {
  const state = useEditorStore.getState();
  const scenario = state.Scenario;
  const map = state.simConfig?.carla?.map || 'Town10HD';
  const xodr = await resolveXodrTextForSimulation(map);

  const payload: StartSimulationPayload = {
    scenario_id: scenario.id || scenarioIdInput.trim() || '',
    scenario_name: scenario.name || 'Scenario',
    weather: scenario.weather || 'ClearNoon',
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
    // eslint-disable-next-line no-console
    console.debug('Start simulation payload (frontend):', debugPayload);
  } catch (e) {
    // eslint-disable-next-line no-console
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
