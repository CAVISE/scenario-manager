import { defaultSimConfig } from '../constants/defaultSimConfig';
import type {
  AttackStageType,
  AttackStageTypeWithCustom,
  OpenCDAAttackStage,
  SimulationConfig,
} from '../types/configGeneratorsTypes';

const VALID_ATTACK_TYPES: readonly AttackStageType[] = [
  'sniffer',
  'dropper',
  'replayer',
  'spoofer',
];

const VALID_CARLA_MAPS = new Set([
  'Town01',
  'Town02',
  'Town03',
  'Town04',
  'Town05',
  'Town06',
  'Town07',
  'Town10HD',
  'TownBig',
]);

export function isValidAttackType(type: string): type is AttackStageType {
  return VALID_ATTACK_TYPES.includes(type as AttackStageType);
}

export function normalizeAttackType(type: string): AttackStageTypeWithCustom {
  const normalized = type.toLowerCase();
  return isValidAttackType(normalized)
    ? normalized
    : (type as AttackStageTypeWithCustom);
}

export function normalizeAttackStages(value: unknown): OpenCDAAttackStage[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    const candidates = Array.isArray(item) ? item : [item];
    return candidates.flatMap((candidate) => {
      if (
        !candidate ||
        typeof candidate !== 'object' ||
        Array.isArray(candidate)
      ) {
        return [];
      }
      const stage = candidate as OpenCDAAttackStage;
      return [
        stage.type
          ? { ...stage, type: normalizeAttackType(stage.type) }
          : stage,
      ];
    });
  });
}

function normalizeCarlaMap(mapValue: unknown): string {
  if (typeof mapValue !== 'string') return defaultSimConfig.carla.map;
  const map = mapValue.trim();
  if (map === 'town10') return 'Town10HD';
  return VALID_CARLA_MAPS.has(map) ? map : defaultSimConfig.carla.map;
}

export function mergeSimConfigWithDefaults(
  partial: Partial<SimulationConfig> | undefined | null
): SimulationConfig {
  const config = partial ?? {};
  const omnet = { ...defaultSimConfig.omnet, ...config.omnet };
  if (omnet.protocol === 'DSRC') omnet.protocol = 'ITS-G5';

  return {
    ...defaultSimConfig,
    ...config,
    attacks: (config.attacks ?? defaultSimConfig.attacks).map((attack) => ({
      ...attack,
      stages: normalizeAttackStages(attack.stages),
    })),
    omnet,
    artery: { ...defaultSimConfig.artery, ...config.artery },
    sumo: {
      ...defaultSimConfig.sumo,
      ...config.sumo,
      vtypes: config.sumo?.vtypes ?? defaultSimConfig.sumo.vtypes,
    },
    sionna: { ...defaultSimConfig.sionna, ...config.sionna },
    carla: {
      ...defaultSimConfig.carla,
      ...config.carla,
      map: normalizeCarlaMap(config.carla?.map),
      sensors: {
        ...defaultSimConfig.carla.sensors,
        ...config.carla?.sensors,
      },
      weather_override: Object.prototype.hasOwnProperty.call(
        config.carla ?? {},
        'weather_override'
      )
        ? (config.carla?.weather_override ?? {})
        : { ...defaultSimConfig.carla.weather_override },
    },
    opencda: {
      ...defaultSimConfig.opencda,
      ...config.opencda,
      bp_class_sample_prob: {
        ...defaultSimConfig.opencda.bp_class_sample_prob,
        ...config.opencda?.bp_class_sample_prob,
      },
      lidar_sim: {
        ...defaultSimConfig.opencda.lidar_sim,
        ...config.opencda?.lidar_sim,
      },
      local_planner: {
        ...defaultSimConfig.opencda.local_planner,
        ...config.opencda?.local_planner,
      },
      gnss_noise: {
        ...defaultSimConfig.opencda.gnss_noise,
        ...config.opencda?.gnss_noise,
      },
      map_manager: {
        ...defaultSimConfig.opencda.map_manager,
        ...config.opencda?.map_manager,
      },
      safety_manager: {
        ...defaultSimConfig.opencda.safety_manager,
        ...config.opencda?.safety_manager,
      },
      controller_pid: {
        ...defaultSimConfig.opencda.controller_pid,
        ...config.opencda?.controller_pid,
      },
      platoon_base: {
        ...defaultSimConfig.opencda.platoon_base,
        ...config.opencda?.platoon_base,
        leader_speeds_profile:
          config.opencda?.platoon_base?.leader_speeds_profile ??
          defaultSimConfig.opencda.platoon_base.leader_speeds_profile,
      },
      metrics: {
        ...defaultSimConfig.opencda.metrics,
        ...config.opencda?.metrics,
      },
      vehicle_behavior_services: {
        ...defaultSimConfig.opencda.vehicle_behavior_services,
        ...config.opencda?.vehicle_behavior_services,
      },
      coop_perception: {
        ...defaultSimConfig.opencda.coop_perception,
        ...config.opencda?.coop_perception,
        background:
          config.opencda?.coop_perception?.background ??
          defaultSimConfig.opencda.coop_perception.background,
        lidar_other_color:
          config.opencda?.coop_perception?.lidar_other_color ??
          defaultSimConfig.opencda.coop_perception.lidar_other_color,
        bbox_gt_color:
          config.opencda?.coop_perception?.bbox_gt_color ??
          defaultSimConfig.opencda.coop_perception.bbox_gt_color,
        bbox_pred_color:
          config.opencda?.coop_perception?.bbox_pred_color ??
          defaultSimConfig.opencda.coop_perception.bbox_pred_color,
      },
      export_profile:
        config.opencda?.export_profile ??
        defaultSimConfig.opencda.export_profile,
      vehicle_base_color:
        config.opencda?.vehicle_base_color ??
        defaultSimConfig.opencda.vehicle_base_color,
      bg_spawn_range: {
        ...defaultSimConfig.opencda.bg_spawn_range,
        ...config.opencda?.bg_spawn_range,
        x_step:
          config.opencda?.bg_spawn_range?.x_step ??
          (config.opencda?.bg_spawn_range as { z_min?: number } | undefined)
            ?.z_min ??
          defaultSimConfig.opencda.bg_spawn_range.x_step,
        y_step:
          config.opencda?.bg_spawn_range?.y_step ??
          (config.opencda?.bg_spawn_range as { z_max?: number } | undefined)
            ?.z_max ??
          defaultSimConfig.opencda.bg_spawn_range.y_step,
      },
    },
    capi: {
      ...defaultSimConfig.capi,
      ...config.capi,
      extra_configs:
        config.capi?.extra_configs ?? defaultSimConfig.capi.extra_configs,
    },
    mpc: { ...defaultSimConfig.mpc, ...config.mpc },
  };
}
