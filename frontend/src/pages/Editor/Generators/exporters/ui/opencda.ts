import {
  mergeSimConfigWithDefaults,
  type SimulationConfig,
} from '../../types/configGeneratorsTypes';
import { weatherParamsFromPreset } from '../opencdaWeather';
import {
  pushBehaviorMetrics,
  pushController,
  pushCoopPerception,
  pushLocalizationMetrics,
  pushMapManager,
  pushPlatoonBase,
  pushSafetyManager,
  pushCavSensingOverride,
  pushVehicleBehaviorServices,
  pushV2xBlock,
} from '../opencdaYamlSections';
import type {
  Car,
  Lidar,
  Point,
  RSU,
  CavBehaviorService,
  RsuBehaviorService,
} from '../../../../../store/types/useEditorStoreTypes';

const YAML_RESERVED_STRINGS = new Set([
  'true',
  'false',
  'null',
  'yes',
  'no',
  'on',
  'off',
  '~',
]);

function yamlScalar(value: unknown): string {
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    const isPlainString =
      /^[A-Za-z_][A-Za-z0-9_./]*$/.test(value) &&
      !YAML_RESERVED_STRINGS.has(normalized);
    return isPlainString ? value : JSON.stringify(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  if (value == null) return 'null';
  return JSON.stringify(value);
}

function pushYamlNode(lines: string[], indent: string, value: unknown): void {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      lines.push(`${indent}[]`);
      return;
    }
    for (const item of value) {
      if (item != null && typeof item === 'object' && !Array.isArray(item)) {
        lines.push(`${indent}-`);
        pushYamlObject(lines, `${indent}  `, item as Record<string, unknown>);
      } else if (Array.isArray(item)) {
        lines.push(`${indent}-`);
        pushYamlNode(lines, `${indent}  `, item);
      } else {
        lines.push(`${indent}- ${yamlScalar(item)}`);
      }
    }
    return;
  }
  if (value != null && typeof value === 'object') {
    const objectValue = value as Record<string, unknown>;
    if (Object.values(objectValue).every((item) => item === undefined)) {
      lines.push(`${indent}{}`);
    } else {
      pushYamlObject(lines, indent, objectValue);
    }
    return;
  }
  lines.push(`${indent}${yamlScalar(value)}`);
}

function pushYamlObject(
  lines: string[],
  indent: string,
  obj: Record<string, unknown>,
): void {
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    const serializedKey = yamlScalar(key);
    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${indent}${serializedKey}: []`);
      } else {
        lines.push(`${indent}${serializedKey}:`);
        pushYamlNode(lines, `${indent}  `, value);
      }
    } else if (value != null && typeof value === 'object') {
      const objectValue = value as Record<string, unknown>;
      if (Object.values(objectValue).every((item) => item === undefined)) {
        lines.push(`${indent}${serializedKey}: {}`);
      } else {
        lines.push(`${indent}${serializedKey}:`);
        pushYamlObject(lines, `${indent}  `, objectValue);
      }
    } else {
      lines.push(`${indent}${serializedKey}: ${yamlScalar(value)}`);
    }
  }
}

const CAM_POSITIONS = [
  '[2.5, 0, 1.0, 0]',
  '[0.0, 0.3, 1.8, 100]',
  '[0.0, -0.3, 1.8, -100]',
  '[-2.0, 0.0, 1.5, 180]',
];
const MAX_CAM_POSITIONS = CAM_POSITIONS.length;
const OMEGA_DT = '${world.fixed_delta_seconds}';

function fmtColor(rgb: [number, number, number]): string {
  return `[${rgb[0]}, ${rgb[1]}, ${rgb[2]}]`;
}

function effectiveCamNum(requested: number): number {
  return Math.max(0, Math.min(requested, MAX_CAM_POSITIONS));
}

function pushCameraBlock(
  lines: string[],
  indent: string,
  visualize: number,
  requestedNum: number,
  positions?: [number, number, number, number][],
): void {
  const serializedPositions = positions?.length
    ? positions.map((position) => `[${position.join(', ')}]`)
    : CAM_POSITIONS;
  const num = Math.min(
    effectiveCamNum(requestedNum),
    serializedPositions.length,
  );
  lines.push(`${indent}camera:`);
  lines.push(`${indent}  visualize: ${visualize}`);
  lines.push(`${indent}  num: ${num}`);
  if (num > 0) {
    lines.push(`${indent}  positions:`);
    for (let i = 0; i < num; i++) {
      lines.push(`${indent}    - ${serializedPositions[i]}`);
    }
  }
}

function pushLocalizationBlock(
  lines: string[],
  indent: string,
  oc: SimulationConfig['opencda'],
  activate: boolean,
  debugAnimation: boolean,
  includeMetrics: boolean,
): void {
  const gn = oc.gnss_noise;
  lines.push(`${indent}localization:`);
  lines.push(`${indent}  activate: ${activate}`);
  lines.push(`${indent}  dt: ${OMEGA_DT}`);
  if (includeMetrics) {
    pushLocalizationMetrics(
      lines,
      oc.metrics.localization_trace_warmup,
      `${indent}  `,
    );
  }
  lines.push(`${indent}  gnss:`);
  lines.push(`${indent}    noise_alt_stddev: ${gn.alt_stddev}`);
  lines.push(`${indent}    noise_lat_stddev: ${gn.lat_stddev}`);
  lines.push(`${indent}    noise_lon_stddev: ${gn.lon_stddev}`);
  lines.push(
    `${indent}    heading_direction_stddev: ${gn.heading_direction_stddev}`,
  );
  lines.push(`${indent}    speed_stddev: ${gn.speed_stddev}`);
  lines.push(`${indent}  debug_helper:`);
  lines.push(`${indent}    show_animation: ${debugAnimation}`);
  lines.push(`${indent}    x_scale: ${oc.localization_debug_x_scale}`);
  lines.push(`${indent}    y_scale: ${oc.localization_debug_y_scale}`);
}

function pushCavBehaviorServices(
  lines: string[],
  indent: string,
  services: CavBehaviorService[],
): void {
  lines.push(`${indent}behavior_services:`);
  for (const svc of services) {
    if (svc.type === 'self_informer') {
      lines.push(`${indent}  - type: self_informer`);
    } else if (svc.type === 'aim_client') {
      lines.push(`${indent}  - type: aim_client`);
      if (svc.debug != null) lines.push(`${indent}    debug: ${svc.debug}`);
    } else if (svc.type === 'movement_controller') {
      lines.push(`${indent}  - type: movement_controller`);
    }
  }
}

function pushRsuBehaviorServices(
  lines: string[],
  indent: string,
  services: RsuBehaviorService[],
): void {
  lines.push(`${indent}behavior_services:`);
  for (const svc of services) {
    if (svc.type === 'aim_server') {
      lines.push(`${indent}  - type: aim_server`);
      if (svc.debug != null) lines.push(`${indent}    debug: ${svc.debug}`);
      if (svc.control_radius != null)
        lines.push(`${indent}    control_radius: ${svc.control_radius}`);
      if (svc.control_center_location != null) {
        lines.push(`${indent}    control_center_location:`);
        lines.push(`${indent}      x: ${svc.control_center_location.x}`);
        lines.push(`${indent}      y: ${svc.control_center_location.y}`);
        lines.push(`${indent}      z: ${svc.control_center_location.z}`);
      }
      if (svc.model) {
        lines.push(`${indent}    model: ${yamlScalar(svc.model)}`);
      }
      if (svc.underling_model)
        lines.push(
          `${indent}    underling_model: ${yamlScalar(svc.underling_model)}`,
        );
      if (svc.hidden_channels != null)
        lines.push(`${indent}    hidden_channels: ${svc.hidden_channels}`);
      if (svc.weight) {
        lines.push(`${indent}    weight: ${yamlScalar(svc.weight)}`);
      }
      if (svc.priority != null)
        lines.push(`${indent}    priority: ${svc.priority}`);
    }
  }
}

function pushExtendedVehicleBase(
  lines: string[],
  oc: SimulationConfig['opencda'],
): void {
  pushMapManager(lines, oc.map_manager);
  pushSafetyManager(lines, oc.safety_manager);
  pushController(lines, oc.controller_pid);
  pushV2xBlock(lines, oc.v2x_enabled, oc.v2x_communication_range);
  if (oc.export_vehicle_behavior_services) {
    pushVehicleBehaviorServices(lines, oc.vehicle_behavior_services);
  }
}

function cavNumericId(car: Car, index: number): number {
  if (car.opencda_id != null) return car.opencda_id;
  const parsed = parseInt(car.id, 10);
  if (!Number.isNaN(parsed)) return parsed;
  return (index + 1) * 100;
}

function rsuNumericId(rsu: RSU, index: number, aimStyle: boolean): number {
  if (rsu.opencda_id != null) return rsu.opencda_id;
  return aimStyle ? index + 1 : -(index + 1);
}

function hasBehaviorOverride(car: Car): boolean {
  return (
    car.opencda_max_speed != null ||
    car.opencda_ignore_traffic_light != null ||
    car.opencda_overtake_allowed != null ||
    car.opencda_collision_time_ahead != null ||
    car.opencda_local_planner_debug != null ||
    car.opencda_local_planner_debug_trajectory != null
  );
}

function cavDisplayName(car: Car, index: number): string {
  const trimmed = car.opencda_name?.trim();
  if (trimmed) return trimmed;
  return `cav${index + 1}`;
}

function rsuDisplayName(rsu: RSU, index: number): string {
  const trimmed = rsu.opencda_name?.trim();
  if (trimmed) return trimmed;
  return `rsu${index + 1}`;
}

function pushVehicleBaseBehavior(
  lines: string[],
  oc: SimulationConfig['opencda'],
): void {
  lines.push('  behavior:');
  lines.push(`    max_speed: ${oc.max_speed}`);
  lines.push(`    tailgate_speed: ${oc.tailgate_speed}`);
  lines.push(`    speed_lim_dist: ${oc.speed_lim_dist}`);
  lines.push(`    speed_decrease: ${oc.speed_decrease}`);
  lines.push(`    safety_time: ${oc.safety_time}`);
  lines.push(`    emergency_param: ${oc.emergency_param}`);
  lines.push(`    ignore_traffic_light: ${oc.ignore_traffic_light}`);
  lines.push(`    overtake_allowed: ${oc.overtake_allowed}`);
  lines.push(`    collision_time_ahead: ${oc.collision_time_ahead}`);
  lines.push(`    overtake_counter_recover: ${oc.overtake_counter_recover}`);
  lines.push(`    sample_resolution: ${oc.sample_resolution}`);
  lines.push('    local_planner:');
  lines.push(`      buffer_size: ${oc.local_planner.buffer_size}`);
  lines.push(
    `      trajectory_update_freq: ${oc.local_planner.trajectory_update_freq}`,
  );
  lines.push(
    `      waypoint_update_freq: ${oc.local_planner.waypoint_update_freq}`,
  );
  lines.push(`      min_dist: ${oc.local_planner.min_dist}`);
  lines.push(`      trajectory_dt: ${oc.local_planner.trajectory_dt}`);
  lines.push(`      debug: ${oc.local_planner.debug}`);
  lines.push(`      debug_trajectory: ${oc.local_planner.debug_trajectory}`);
  if (oc.export_metrics) {
    pushBehaviorMetrics(lines, oc.metrics);
  }
  if (oc.vehicle_base_color) {
    lines.push(`    color: ${fmtColor(oc.vehicle_base_color)}`);
  }
}

function pushVehicleLocalization(
  lines: string[],
  oc: SimulationConfig['opencda'],
): void {
  pushLocalizationBlock(
    lines,
    '    ',
    oc,
    oc.localization_activate,
    oc.vehicle_localization_debug_animation,
    oc.export_metrics,
  );
}

function pushCavBehaviorOverride(lines: string[], car: Car): void {
  if (!hasBehaviorOverride(car)) return;
  lines.push('      behavior:');
  if (car.opencda_max_speed != null) {
    lines.push(`        max_speed: ${car.opencda_max_speed}`);
  }
  if (car.opencda_ignore_traffic_light != null) {
    lines.push(
      `        ignore_traffic_light: ${car.opencda_ignore_traffic_light}`,
    );
  }
  if (car.opencda_overtake_allowed != null) {
    lines.push(`        overtake_allowed: ${car.opencda_overtake_allowed}`);
  }
  if (car.opencda_collision_time_ahead != null) {
    lines.push(
      `        collision_time_ahead: ${car.opencda_collision_time_ahead}`,
    );
  }
  if (
    car.opencda_local_planner_debug != null ||
    car.opencda_local_planner_debug_trajectory != null
  ) {
    lines.push('        local_planner:');
    if (car.opencda_local_planner_debug != null) {
      lines.push(`          debug: ${car.opencda_local_planner_debug}`);
    }
    if (car.opencda_local_planner_debug_trajectory != null) {
      lines.push(
        `          debug_trajectory: ${car.opencda_local_planner_debug_trajectory}`,
      );
    }
  }
}

export function generateOpenCDAConfig(
  config: SimulationConfig,
  cars: Car[],
  rsus: RSU[],
  points: Point[],
  lidars: Lidar[] = [],
): string {
  const cfg = mergeSimConfigWithDefaults(config);
  const oc = cfg.opencda;
  const carla = cfg.carla;
  const ls = oc.lidar_sim;
  const bgR = oc.bg_spawn_range;
  const weather = {
    ...weatherParamsFromPreset(carla.weather_preset),
    ...(carla.weather_override ?? {}),
  };
  const aimStyle = oc.export_profile === 'aim_check';
  const lines: string[] = [];

  lines.push(`description: |-`);
  if (aimStyle) {
    lines.push(`  Scenario testing AIM models - generated by ScenarioManager`);
  } else {
    lines.push(`  OpenCDA scenario generated by ScenarioManager`);
    lines.push(
      `  Town: ${carla.map} | Vehicles: ${cars.length} | RSUs: ${rsus.length}`,
    );
  }
  lines.push('');

  if (oc.export_attacks) {
    const attacks = cfg.attacks ?? [];
    if (attacks.length === 0) {
      lines.push('attacks: []');
    } else {
      lines.push('attacks:');
      for (const attack of attacks) {
        lines.push('  -');
        pushYamlObject(lines, '    ', attack as Record<string, unknown>);
      }
    }
    lines.push('');
  }

  lines.push('world:');
  lines.push(`  town: ${yamlScalar(carla.map)}`);
  if (oc.export_world_client_host) {
    lines.push(`  client_host: ${yamlScalar(oc.world_client_host)}`);
  }
  lines.push('  weather:');
  for (const [key, value] of Object.entries(weather)) {
    lines.push(`    ${key}: ${value}`);
  }
  lines.push(`  fixed_delta_seconds: ${carla.fixed_delta_seconds}`);
  lines.push(`  sync_mode: ${carla.synchronous_mode}`);
  lines.push(`  client_port: ${carla.client_port}`);
  lines.push(`  seed: ${carla.seed}`);
  lines.push('');

  lines.push('blueprint:');
  lines.push(`  use_multi_class_bp: ${oc.use_multi_class_bp}`);
  lines.push(`  bp_meta_path: ${yamlScalar(oc.bp_meta_path)}`);
  lines.push('  bp_class_sample_prob:');
  lines.push(`    car: ${oc.bp_class_sample_prob.car}`);
  lines.push(`    truck: ${oc.bp_class_sample_prob.truck}`);
  lines.push(`    bus: ${oc.bp_class_sample_prob.bus}`);
  lines.push(`    bicycle: ${oc.bp_class_sample_prob.bicycle}`);
  lines.push(`    motorcycle: ${oc.bp_class_sample_prob.motorcycle}`);
  lines.push('');

  lines.push('rsu_base:');
  lines.push('  sensing:');
  lines.push('    perception:');
  lines.push(`      activate: ${oc.rsu_perception_activate}`);
  pushCameraBlock(lines, '      ', oc.rsu_camera_visualize, oc.rsu_cam_num);
  lines.push('      lidar:');
  lines.push(`        visualize: ${oc.lidar_visualize}`);
  lines.push(`        channels: ${oc.rsu_lidar_channels}`);
  lines.push(`        range: ${oc.rsu_lidar_range}`);
  lines.push(`        points_per_second: ${oc.lidar_points_per_second}`);
  lines.push(`        rotation_frequency: ${oc.lidar_rotation_frequency}`);
  lines.push(`        upper_fov: ${oc.lidar_upper_fov}`);
  lines.push(`        lower_fov: ${oc.lidar_lower_fov}`);
  lines.push(`        dropoff_general_rate: ${ls.dropoff_general_rate}`);
  lines.push(`        dropoff_intensity_limit: ${ls.dropoff_intensity_limit}`);
  lines.push(`        dropoff_zero_intensity: ${ls.dropoff_zero_intensity}`);
  lines.push(`        noise_stddev: ${ls.noise_stddev}`);
  pushLocalizationBlock(
    lines,
    '    ',
    oc,
    oc.localization_activate,
    false,
    false,
  );
  lines.push('');

  lines.push('vehicle_base:');
  lines.push('  sensing:');
  lines.push('    perception:');
  lines.push(`      activate: ${oc.perception_activate}`);
  pushCameraBlock(
    lines,
    '      ',
    oc.vehicle_camera_visualize,
    oc.vehicle_cam_num,
  );
  lines.push('      lidar:');
  lines.push(`        visualize: ${oc.lidar_visualize}`);
  lines.push(`        channels: ${oc.lidar_channels}`);
  lines.push(`        range: ${oc.lidar_range}`);
  lines.push(`        points_per_second: ${oc.lidar_points_per_second}`);
  lines.push(`        rotation_frequency: ${oc.lidar_rotation_frequency}`);
  lines.push(`        upper_fov: ${oc.lidar_upper_fov}`);
  lines.push(`        lower_fov: ${oc.lidar_lower_fov}`);
  lines.push(`        dropoff_general_rate: ${ls.dropoff_general_rate}`);
  lines.push(`        dropoff_intensity_limit: ${ls.dropoff_intensity_limit}`);
  lines.push(`        dropoff_zero_intensity: ${ls.dropoff_zero_intensity}`);
  lines.push(`        noise_stddev: ${ls.noise_stddev}`);
  pushVehicleLocalization(lines, oc);
  pushVehicleBaseBehavior(lines, oc);
  pushExtendedVehicleBase(lines, oc);
  lines.push('');

  lines.push('sumo:');
  lines.push(`  port: ${oc.sumo_port}`);
  lines.push(`  host: ${yamlScalar(oc.sumo_host)}`);
  lines.push(`  gui: ${oc.sumo_gui}`);
  lines.push(`  client_order: ${oc.sumo_client_order}`);
  lines.push(`  step_length: \${world.fixed_delta_seconds}`);
  lines.push('');

  lines.push('carla_traffic_manager:');
  lines.push(`  port: ${carla.traffic_manager_port}`);
  lines.push(`  sync_mode: ${carla.synchronous_mode}`);
  lines.push(`  global_speed_perc: ${oc.global_speed_perc}`);
  lines.push(`  global_distance: ${oc.bg_global_distance}`);
  lines.push(`  auto_lane_change: ${oc.auto_lane_change}`);
  lines.push(`  set_osm_mode: ${oc.bg_set_osm_mode}`);
  lines.push(`  random: ${oc.bg_traffic_random}`);
  lines.push(`  ignore_lights_percentage: ${oc.ignore_lights_percentage}`);
  lines.push(`  ignore_signs_percentage: ${oc.bg_ignore_signs_percentage}`);
  lines.push(`  ignore_walkers_percentage: ${oc.bg_ignore_walkers_percentage}`);
  lines.push(`  ignore_vehicles_percentage: ${oc.ignore_vehicles_percentage}`);
  lines.push(
    `  random_left_lanechange_percentage: ${oc.random_left_lanechange_percentage}`,
  );
  lines.push(
    `  random_right_lanechange_percentage: ${oc.random_right_lanechange_percentage}`,
  );
  if (oc.enable_background_traffic) {
    lines.push('  vehicle_list: ~');
    lines.push('  range:');
    lines.push(
      `    - [${bgR.x_min}, ${bgR.x_max}, ${bgR.y_min}, ${bgR.y_max}, ${bgR.x_step}, ${bgR.y_step}, ${oc.bg_vehicle_num}]`,
    );
  } else {
    lines.push('  vehicle_list: []');
    lines.push('  range: []');
  }
  lines.push('');

  lines.push('traffic_manager:');
  lines.push(`  global_distance_to_leading_vehicle: ${oc.bg_global_distance}`);
  lines.push(`  synchronous_mode: ${carla.synchronous_mode}`);
  lines.push('');

  if (oc.export_platoon_base) {
    pushPlatoonBase(lines, oc.platoon_base, oc.export_metrics);
  }

  if (oc.export_coop_perception) {
    pushCoopPerception(lines, oc.coop_perception);
  }

  lines.push('scenario:');
  if (oc.export_platoon_base) {
    lines.push('  platoon_list: []');
  }

  if (rsus.length > 0) {
    lines.push('  rsu_list:');
    rsus.forEach((rsu, i) => {
      lines.push(`    - name: ${yamlScalar(rsuDisplayName(rsu, i))}`);
      lines.push(
        `      spawn_position: [${rsu.x.toFixed(2)}, ${rsu.y.toFixed(2)}, ${rsu.z.toFixed(2)}, 0, 0, 0]`,
      );
      lines.push(`      id: ${rsuNumericId(rsu, i, aimStyle)}`);
      if (rsu.opencda_color) {
        lines.push(`      color: ${fmtColor(rsu.opencda_color)}`);
      }
      const sensing = rsu.opencda_sensing ?? {};
      lines.push('      v2x:');
      lines.push(`        communication_range: ${rsu.range}`);
      lines.push(`        tx_power: ${rsu.tx_power}`);
      lines.push(`        frequency: ${rsu.frequency}`);
      lines.push(`        protocol: ${yamlScalar(rsu.protocol)}`);
      lines.push(`        beacon_interval: ${rsu.beacon_interval}`);
      lines.push('      sensing:');
      lines.push('        perception:');
      lines.push(
        `          activate: ${sensing.perception_activate ?? oc.rsu_perception_activate}`,
      );
      lines.push(
        `          detection_range: ${sensing.detection_range ?? 100}`,
      );
      pushCameraBlock(
        lines,
        '          ',
        sensing.camera_visualize ?? oc.rsu_camera_visualize,
        sensing.camera_num ?? oc.rsu_cam_num,
        sensing.camera_positions,
      );
      lines.push('          lidar:');
      lines.push(
        `            visualize: ${sensing.lidar_visualize ?? oc.lidar_visualize}`,
      );
      lines.push(
        `            channels: ${sensing.lidar_channels ?? oc.rsu_lidar_channels}`,
      );
      lines.push(
        `            range: ${sensing.lidar_range ?? oc.rsu_lidar_range}`,
      );
      lines.push(
        `            points_per_second: ${sensing.lidar_points_per_second ?? oc.lidar_points_per_second}`,
      );
      lines.push(
        `            rotation_frequency: ${sensing.lidar_rotation_frequency ?? oc.lidar_rotation_frequency}`,
      );
      lines.push(
        `            upper_fov: ${sensing.lidar_upper_fov ?? oc.lidar_upper_fov}`,
      );
      lines.push(
        `            lower_fov: ${sensing.lidar_lower_fov ?? oc.lidar_lower_fov}`,
      );
      lines.push(
        `            dropoff_general_rate: ${sensing.lidar_dropoff_general_rate ?? ls.dropoff_general_rate}`,
      );
      lines.push(
        `            dropoff_intensity_limit: ${sensing.lidar_dropoff_intensity_limit ?? ls.dropoff_intensity_limit}`,
      );
      lines.push(
        `            dropoff_zero_intensity: ${sensing.lidar_dropoff_zero_intensity ?? ls.dropoff_zero_intensity}`,
      );
      lines.push(
        `            noise_stddev: ${sensing.lidar_noise_stddev ?? ls.noise_stddev}`,
      );
      lines.push('        localization:');
      lines.push(
        `          activate: ${sensing.localization_activate ?? true}`,
      );
      lines.push(`          dt: ${OMEGA_DT}`);
      lines.push('          gnss:');
      lines.push(
        `            noise_alt_stddev: ${sensing.gnss_noise_alt_stddev ?? oc.gnss_noise.alt_stddev}`,
      );
      lines.push(
        `            noise_lat_stddev: ${sensing.gnss_noise_lat_stddev ?? oc.gnss_noise.lat_stddev}`,
      );
      lines.push(
        `            noise_lon_stddev: ${sensing.gnss_noise_lon_stddev ?? oc.gnss_noise.lon_stddev}`,
      );
      if (rsu.opencda_behavior_services?.length) {
        pushRsuBehaviorServices(lines, '      ', rsu.opencda_behavior_services);
      }
    });
  } else {
    lines.push('  rsu_list: []');
  }

  if (cars.length > 0) {
    lines.push('  single_cav_list:');
    cars.forEach((car, i) => {
      const yawDeg = car.rotation
        ? ((car.rotation * 180) / Math.PI).toFixed(1)
        : '0.0';
      const carPoints = car.id ? points.filter((p) => p.carId === car.id) : [];
      const dest =
        carPoints.length > 0
          ? carPoints[carPoints.length - 1]
          : { x: car.x, y: car.y, z: car.z };

      lines.push(`    - name: ${yamlScalar(cavDisplayName(car, i))}`);
      if (car.opencda_spawn_special != null) {
        lines.push(`      spawn_special: [${car.opencda_spawn_special}]`);
      } else {
        lines.push(
          `      spawn_position: [${car.x.toFixed(2)}, ${car.y.toFixed(2)}, ${car.z.toFixed(2)}, 0, ${yawDeg}, 0]`,
        );
      }
      lines.push(
        `      destination: [${dest.x.toFixed(2)}, ${dest.y.toFixed(2)}, ${dest.z.toFixed(2)}]`,
      );
      lines.push(`      id: ${cavNumericId(car, i)}`);

      if (car.opencda_carla_model?.trim()) {
        lines.push(
          `      model: ${yamlScalar(car.opencda_carla_model.trim())}`,
        );
      }
      if (car.opencda_color) {
        lines.push(`      color: ${fmtColor(car.opencda_color)}`);
      }

      const attachedLidar = lidars.find((lidar) => lidar.carId === car.id);
      pushCavSensingOverride(lines, car, '      ', attachedLidar);
      pushCavBehaviorOverride(lines, car);

      if (car.opencda_v2x) {
        lines.push('      v2x:');
        if (car.opencda_v2x.enabled != null) {
          lines.push(`        enabled: ${car.opencda_v2x.enabled}`);
        }
        if (car.opencda_v2x.communication_range != null) {
          lines.push(
            `        communication_range: ${car.opencda_v2x.communication_range}`,
          );
        }
      }

      if (car.opencda_behavior_services?.length) {
        pushCavBehaviorServices(lines, '      ', car.opencda_behavior_services);
      }
    });
  } else {
    lines.push('  single_cav_list: []');
  }

  return lines.join('\n');
}
