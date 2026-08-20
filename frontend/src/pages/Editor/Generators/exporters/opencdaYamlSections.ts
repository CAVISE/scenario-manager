import type { SimulationConfig } from '../types/configGeneratorsTypes';
import type { Car, Lidar } from '@/store/types/useEditorStoreTypes';

const OMEGA_DT = '${world.fixed_delta_seconds}';

export function fmtRgb(rgb: [number, number, number]): string {
  return `[${rgb[0]}, ${rgb[1]}, ${rgb[2]}]`;
}

export function pushMapManager(
  lines: string[],
  mm: SimulationConfig['opencda']['map_manager'],
): void {
  lines.push('  map_manager:');
  lines.push(`    pixels_per_meter: ${mm.pixels_per_meter}`);
  lines.push(`    raster_size: [${mm.raster_size[0]}, ${mm.raster_size[1]}]`);
  lines.push(`    lane_sample_resolution: ${mm.lane_sample_resolution}`);
  lines.push(`    visualize: ${mm.visualize}`);
  lines.push(`    activate: ${mm.activate}`);
}

export function pushSafetyManager(
  lines: string[],
  sm: SimulationConfig['opencda']['safety_manager'],
): void {
  lines.push('  safety_manager:');
  lines.push(`    print_message: ${sm.print_message}`);
  lines.push('    collision_sensor:');
  lines.push(`      history_size: ${sm.collision_history_size}`);
  lines.push(`      col_thresh: ${sm.collision_col_thresh}`);
  lines.push('    stuck_dector:');
  lines.push(`      len_thresh: ${sm.stuck_len_thresh}`);
  lines.push(`      speed_thresh: ${sm.stuck_speed_thresh}`);
  lines.push('    offroad_dector: []');
  lines.push('    traffic_light_detector:');
  lines.push(`      light_dist_thresh: ${sm.traffic_light_dist_thresh}`);
}

export function pushController(
  lines: string[],
  c: SimulationConfig['opencda']['controller_pid'],
): void {
  lines.push('  controller:');
  lines.push(`    type: ${c.type}`);
  lines.push('    args:');
  lines.push('      lat:');
  lines.push(`        k_p: ${c.lat_k_p}`);
  lines.push(`        k_d: ${c.lat_k_d}`);
  lines.push(`        k_i: ${c.lat_k_i}`);
  lines.push('      lon:');
  lines.push(`        k_p: ${c.lon_k_p}`);
  lines.push(`        k_d: ${c.lon_k_d}`);
  lines.push(`        k_i: ${c.lon_k_i}`);
  lines.push(`      dynamic: ${c.dynamic}`);
  lines.push(`      dt: ${OMEGA_DT}`);
  lines.push(`      max_brake: ${c.max_brake}`);
  lines.push(`      max_throttle: ${c.max_throttle}`);
  lines.push(`      max_steering: ${c.max_steering}`);
}

export function pushV2xBlock(
  lines: string[],
  enabled: boolean,
  range: number,
  positionSource: 'estimated' | 'ground_truth',
  indent = '  ',
): void {
  lines.push(`${indent}v2x:`);
  lines.push(`${indent}  enabled: ${enabled}`);
  lines.push(`${indent}  communication_range: ${range}`);
  lines.push(`${indent}  position_source: ${positionSource}`);
}

export function pushVehicleBehaviorServices(
  lines: string[],
  s: SimulationConfig['opencda']['vehicle_behavior_services'],
): void {
  lines.push('  behavior_services:');
  if (s.self_informer) lines.push('    - type: self_informer');
  if (s.movement_controller) lines.push('    - type: movement_controller');
}

export function pushLocalizationMetrics(
  lines: string[],
  warmup: number,
  indent: string,
): void {
  lines.push(`${indent}metrics:`);
  lines.push(`${indent}  metric_configs:`);
  lines.push(`${indent}    trace:`);
  lines.push(`${indent}      warmup_steps: ${warmup}`);
}

export function pushBehaviorMetrics(
  lines: string[],
  m: SimulationConfig['opencda']['metrics'],
): void {
  lines.push('    metrics:');
  lines.push('      metric_configs:');
  const entries: [string, number][] = [
    ['speed', m.behavior_speed_warmup],
    ['acceleration', m.behavior_acceleration_warmup],
    ['ttc', m.behavior_ttc_warmup],
    ['hard_brake_count', m.behavior_hard_brake_warmup],
  ];
  for (const [field, warmup] of entries) {
    lines.push(`        ${field}:`);
    lines.push(`          warmup_steps: ${warmup}`);
  }
}

export function pushPlatoonBase(
  lines: string[],
  p: SimulationConfig['opencda']['platoon_base'],
  includeMetrics: boolean,
): void {
  lines.push('platoon_base:');
  lines.push(`  max_capacity: ${p.max_capacity}`);
  lines.push(`  inter_gap: ${p.inter_gap}`);
  lines.push(`  open_gap: ${p.open_gap}`);
  lines.push(`  warm_up_speed: ${p.warm_up_speed}`);
  lines.push(`  change_leader_speed: ${p.change_leader_speed}`);
  lines.push(
    `  leader_speeds_profile: [ ${p.leader_speeds_profile[0]}, ${p.leader_speeds_profile[1]} ]`,
  );
  lines.push(`  stage_duration: ${p.stage_duration}`);
  if (includeMetrics) {
    lines.push('  metrics:');
    lines.push('    metric_configs:');
    lines.push('      time_gap:');
    lines.push(`        warmup_steps: ${p.metric_time_gap_warmup}`);
    lines.push('      distance_gap:');
    lines.push(`        warmup_steps: ${p.metric_distance_gap_warmup}`);
  }
  lines.push('');
}

export function pushCoopPerception(
  lines: string[],
  c: SimulationConfig['opencda']['coop_perception'],
): void {
  lines.push('cooperative_perception_visualization:');
  lines.push(`  background: ${fmtRgb(c.background)}`);
  lines.push(`  bbox_line_thickness: ${c.bbox_line_thickness}`);
  lines.push(`  image_dpi: ${c.image_dpi}`);
  lines.push('  lidar_point_colors:');
  lines.push(`    other: ${fmtRgb(c.lidar_other_color)}`);
  lines.push('  bbox_colors:');
  lines.push(`    gt: ${fmtRgb(c.bbox_gt_color)}`);
  lines.push(`    pred: ${fmtRgb(c.bbox_pred_color)}`);
  lines.push('');
}

export function pushCavSensingOverride(
  lines: string[],
  car: Car,
  indent: string,
  lidar?: Lidar,
): void {
  const s = car.opencda_sensing;
  if (!s && !lidar) return;
  lines.push(`${indent}sensing:`);
  lines.push(`${indent}  perception:`);
  if (s?.perception_activate != null) {
    lines.push(`${indent}    activate: ${s.perception_activate}`);
  } else if (lidar) {
    lines.push(`${indent}    activate: true`);
  }
  if (s?.camera_visualize != null || s?.camera_num != null) {
    lines.push(`${indent}    camera:`);
    if (s?.camera_visualize != null) {
      lines.push(`${indent}      visualize: ${s.camera_visualize}`);
    }
    if (s?.camera_num != null) {
      lines.push(`${indent}      num: ${s.camera_num}`);
    }
  }
  if (
    s?.lidar_visualize != null ||
    s?.lidar_channels != null ||
    s?.lidar_range != null ||
    lidar != null
  ) {
    lines.push(`${indent}    lidar:`);
    if (s?.lidar_visualize != null) {
      lines.push(`${indent}      visualize: ${s.lidar_visualize}`);
    }
    const channels = s?.lidar_channels ?? lidar?.channels;
    if (channels != null) {
      lines.push(`${indent}      channels: ${channels}`);
    }
    const range = s?.lidar_range ?? lidar?.range;
    if (range != null) {
      lines.push(`${indent}      range: ${range}`);
    }
    if (lidar?.rotation_frequency != null) {
      lines.push(
        `${indent}      rotation_frequency: ${lidar.rotation_frequency}`,
      );
    }
  }
}
