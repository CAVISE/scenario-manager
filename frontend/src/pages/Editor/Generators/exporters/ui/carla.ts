import type { SimulationConfig } from '../../types/configGeneratorsTypes';
import type {
  Car,
  Point,
  RSU,
} from '../../../../../store/types/useEditorStoreTypes';

export function generateCarlaYaml(
  config: SimulationConfig,
  cars: Car[],
  rsus: RSU[],
  points: Point[],
): string {
  const lines: string[] = [];

  lines.push('world:');
  lines.push(`  town: ${config.carla.map}`);
  lines.push(`  weather: ${config.carla.weather_preset}`);
  lines.push(`  sync_mode: ${config.carla.synchronous_mode}`);
  lines.push(`  fixed_delta_seconds: ${config.carla.fixed_delta_seconds}`);
  lines.push(`  client_port: ${config.carla.client_port}`);
  lines.push(`  seed: ${config.carla.seed}`);
  lines.push(`  simulation_time: ${config.sim_duration}`);
  lines.push('');
  lines.push('traffic_manager:');
  lines.push(`  port: ${config.carla.traffic_manager_port}`);
  lines.push(`  num_vehicles: ${config.carla.num_vehicles}`);
  lines.push(`  num_pedestrians: ${config.carla.num_pedestrians}`);
  lines.push('');
  lines.push('scenario:');
  if (cars.length > 0) {
    lines.push('  single_cav_list:');
    cars.forEach((car, i) => {
      const carPoints = car.id ? points.filter((p) => p.carId === car.id) : [];
      const colorHex = car.color
        ? `0x${car.color.padStart(6, '0')}`
        : '0x00ff00';
      const yaw = car.rotation ? (car.rotation * 57.2958).toFixed(1) : '0.0';
      lines.push(`    - id: ${i}`);
      lines.push(`      model: ${car.model || 'vehicle.tesla.model3'}`);
      lines.push(`      color: "${colorHex}"`);
      lines.push('      spawn_position:');
      lines.push(
        `        - [${car.x.toFixed(2)}, ${car.y.toFixed(2)}, ${car.z.toFixed(2)}, 0.0, ${yaw}, 0.0]`,
      );
      if (carPoints.length > 0) {
        lines.push('      destination:');
        carPoints.forEach((pt) =>
          lines.push(
            `        - [${pt.x.toFixed(2)}, ${pt.y.toFixed(2)}, ${pt.z.toFixed(2)}]`,
          ),
        );
      }
      lines.push('      v2x:');
      lines.push(
        `        communication_range: ${config.omnet.max_interf_dist}`,
      );
      lines.push('');
    });
  }
  if (rsus.length > 0) {
    lines.push('  rsu_list:');
    rsus.forEach((rsu, i) => {
      lines.push(`    - id: ${i}`);
      if (rsu.name) lines.push(`      name: "${rsu.name}"`);
      lines.push('      spawn_position:');
      lines.push(
        `        - [${rsu.x.toFixed(2)}, ${rsu.y.toFixed(2)}, ${rsu.z.toFixed(2)}, 0.0, ${(rsu.azimuth ?? 0).toFixed(1)}, 0.0]`,
      );
      lines.push('      v2x:');
      lines.push(`        communication_range: ${rsu.range}`);
      lines.push(`        tx_power: ${rsu.tx_power}`);
      lines.push(`        frequency: ${rsu.frequency}`);
      lines.push(`        protocol: ${rsu.protocol}`);
      lines.push(
        `        network_protocol: ${rsu.network_protocol ?? 'GeoNetworking'}`,
      );
      lines.push(`        cam_interval: ${rsu.cam_interval ?? 100}`);
      lines.push('      antenna:');
      lines.push(`        type: ${rsu.antenna_type ?? 'isotropic'}`);
      lines.push(`        height: ${rsu.antenna_height ?? 5}`);
      lines.push(`        gain: ${rsu.antenna_gain ?? 0}`);
      lines.push(`        polarization: ${rsu.polarization ?? 'vertical'}`);
      lines.push('');
    });
  }
  lines.push('sensor:');
  if (config.carla.sensors.camera) {
    lines.push('  camera:');
    lines.push('    - name: front_camera');
    lines.push(`      fov: ${config.carla.camera_fov}`);
    lines.push('      image_size_x: 1280');
    lines.push('      image_size_y: 720');
    lines.push('      spawn_point: [1.5, 0.0, 2.4, 0.0, 0.0, 0.0]');
    lines.push('');
  }
  if (config.carla.sensors.lidar) {
    lines.push('  lidar:');
    lines.push('    - name: lidar');
    lines.push(`      channels: ${config.carla.lidar_channels}`);
    lines.push(`      range: ${config.carla.lidar_range}`);
    lines.push('      points_per_second: 100000');
    lines.push('      rotation_frequency: 20');
    lines.push('      spawn_point: [0.0, 0.0, 2.5, 0.0, 0.0, 0.0]');
    lines.push('');
  }
  if (config.carla.sensors.radar) {
    lines.push('  radar:');
    lines.push('    - name: radar');
    lines.push('      horizontal_fov: 30');
    lines.push('      vertical_fov: 10');
    lines.push('      range: 100');
    lines.push('      spawn_point: [2.0, 0.0, 1.0, 0.0, 0.0, 0.0]');
    lines.push('');
  }
  if (config.carla.sensors.gnss) {
    lines.push('  gnss:');
    lines.push('    - name: gnss');
    lines.push('      spawn_point: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0]');
    lines.push('');
  }
  if (config.carla.sensors.imu) {
    lines.push('  imu:');
    lines.push('    - name: imu');
    lines.push('      spawn_point: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0]');
    lines.push('');
  }
  return lines.join('\n');
}
