import type { SimulationConfig} from './types/configGeneratorsTypes';
import type {RSU, Car, Building, Point} from "../../../store/types/useEditorStoreTypes";
export function generateOmnetConfig(config: SimulationConfig, RSUs: RSU[], cars: Car[]): string {
  const rsuLines = RSUs.map((rsu, i) => `
*.rsu[${i}].mobility.x = ${rsu.x.toFixed(1)}
*.rsu[${i}].mobility.y = ${rsu.y.toFixed(1)}
*.rsu[${i}].mobility.z = ${rsu.z.toFixed(1)}
*.rsu[${i}].appl.txPower = ${rsu.tx_power}dBm
*.rsu[${i}].appl.communicationRange = ${rsu.range}m`).join('\n');

  return `[General]
network = V2XScenario
sim-time-limit = ${config.sim_duration}s
debug-on-errors = true

*.playgroundSizeX = 5000m
*.playgroundSizeY = 5000m
*.playgroundSizeZ = 50m

*.connectionManager.sendDirect = true
*.connectionManager.maxInterfDist = ${config.omnet.max_interf_dist}m
*.connectionManager.drawMaxInterfDist = false

*.node[*].nic.mac1609_4.txPower = ${config.omnet.tx_power}dBm
*.node[*].nic.mac1609_4.bitrate = ${config.omnet.bitrate}Mbps
*.node[*].nic.phy80211p.sensitivity = -89dBm
*.node[*].nic.phy80211p.useThermalNoise = true
*.node[*].nic.phy80211p.thermalNoise = -110dBm
*.node[*].nic.phy80211p.decider = xmldoc("config.xml")
*.node[*].nic.phy80211p.analogueModels = xmldoc("config.xml")

*.node[*].appl.headerLength = 80 bit
*.node[*].appl.beaconInterval = ${config.omnet.beaconing_interval}ms
*.node[*].appl.dataOnSch = false
*.node[*].nic.mac1609_4.useServiceChannel = ${config.omnet.protocol === 'ITS-G5' ? 'false' : 'true'}

**.numVehicles = ${cars.length}
**.numRSU = ${RSUs.length}
${rsuLines}
`;
}

export function generateArteryConfig(config: SimulationConfig, RSUs: RSU[]): string {
  const vehicleServices = [
    '<service type=\\"artery.application.CaService\\"><listener port=\\"2001\\"/></service>',
    config.artery.denm_enabled
      ? '<service type=\\"artery.application.DenmService\\"><listener port=\\"2002\\"/></service>'
      : '',
    config.artery.cp_service_enabled
      ? '<service type=\\"artery.cp.CpService\\"><listener port=\\"2003\\"/></service>'
      : '',
  ].filter(Boolean).join('');

  const rsuLines = RSUs.map((rsu, i) => {
    const rsuServices = [
      config.artery.rsu_cam_enabled
        ? '<service type=\\"artery.application.CaService\\"><listener port=\\"2001\\"/></service>'
        : '',
      config.artery.rsu_denm_enabled
        ? '<service type=\\"artery.application.DenmService\\"><listener port=\\"2002\\"/></service>'
        : '',
    ].filter(Boolean).join('');
    return `
*.rsu[${i}].mobility.x = ${rsu.x.toFixed(1)}
*.rsu[${i}].mobility.y = ${rsu.y.toFixed(1)}
*.rsu[${i}].mobility.z = ${rsu.z.toFixed(1)}
*.rsu[${i}].middleware.updateInterval = ${config.artery.middleware_update_interval}ms
*.rsu[${i}].middleware.datetime = "${config.artery.datetime}"
*.rsu[${i}].middleware.services = xml("<services>${rsuServices}</services>")
*.rsu[${i}].wlan[0].radio.transmitter.power = ${rsu.tx_power}dBm
*.rsu[${i}].wlan[0].radio.centerFrequency = ${rsu.frequency}Hz
*.rsu[${i}].wlan[0].mac.bitrate = ${config.omnet.bitrate}Mbps
*.rsu[${i}].appl.communicationRange = ${rsu.range}m
*.rsu[${i}].vanetza[0].access.protocol = "${rsu.protocol}"
*.rsu[${i}].vanetza[0].network.protocol = "${rsu.network_protocol ?? 'GeoNetworking'}"
*.rsu[${i}].antenna.type = "${rsu.antenna_type ?? 'isotropic'}"
*.rsu[${i}].antenna.height = ${rsu.antenna_height ?? 5}m
*.rsu[${i}].antenna.gain = ${rsu.antenna_gain ?? 0}dBi
*.rsu[${i}].antenna.azimuth = ${rsu.azimuth ?? 0}
*.rsu[${i}].antenna.tilt = ${rsu.tilt ?? 0}
*.rsu[${i}].appl.camInterval = ${rsu.cam_interval ?? 100}ms`;
  }).join('\n');

  return `[General]
network = artery.inet.PoweredInetRadioMedium
sim-time-limit = ${config.sim_duration}s
debug-on-errors = true

*.traci.core.version = -1
*.traci.launcher.typename = "PosixLauncher"
*.traci.launcher.sumocfg = "${config.artery.sumo_config}"
*.traci.launcher.stepLength = ${config.artery.sumo_step_length}s
*.traci.launcher.seed = ${config.artery.sumo_seed}

*.node[*].middleware.updateInterval = ${config.artery.middleware_update_interval}ms
*.node[*].middleware.datetime = "${config.artery.datetime}"
*.node[*].middleware.services = xml("<services>${vehicleServices}</services>")
*.node[*].wlan[0].radio.transmitter.power = ${config.omnet.tx_power}dBm
*.node[*].wlan[0].mac.bitrate = ${config.omnet.bitrate}Mbps
*.node[*].vanetza[0].cam.minInterval = ${config.artery.cam_interval_min}ms
*.node[*].vanetza[0].cam.maxInterval = ${config.artery.cam_interval_max}ms

**.numRSU = ${RSUs.length}
${rsuLines}
`;
}

export function generateSionnaConfig(
  config: SimulationConfig,
  RSUs: RSU[],
  buildings: Building[],
  cars: Car[],
): object {
  return {
    scene: { carrier_frequency: config.sionna.carrier_frequency, synthetic_array: true },
    transmitters: RSUs.map((rsu, i) => ({
      name: rsu.name || `rsu_${i}`,
      position: [+rsu.x.toFixed(2), +rsu.y.toFixed(2), +rsu.z.toFixed(2)],
      frequency: rsu.frequency,
      antenna: {
        type: rsu.antenna_type ?? 'isotropic',
        height: rsu.antenna_height ?? 5,
        gain: rsu.antenna_gain ?? 0,
        polarization: rsu.polarization ?? 'vertical',
        orientation: { azimuth: rsu.azimuth ?? 0, tilt: rsu.tilt ?? 0 },
        array: { rows: rsu.mimo_rows ?? 1, columns: rsu.mimo_columns ?? 1, element_spacing: rsu.element_spacing ?? 0.5 },
      },
    })),
    receivers: cars.map((car, i) => ({
      name: `vehicle_${i}`,
      position: [+car.x.toFixed(2), +car.y.toFixed(2), +car.z.toFixed(2)],
    })),
    buildings: buildings.map((b, i) => ({
      name: b.name || `building_${i}`,
      position: [+b.x.toFixed(2), +b.y.toFixed(2), +b.z.toFixed(2)],
      width: b.width ?? 20,
      depth: b.depth ?? 20,
      height: b.height,
      material: b.material,
    })),
    ray_tracing: {
      method: 'fibonacci',
      num_samples: config.sionna.num_samples,
      max_depth: config.sionna.max_depth,
      los: config.sionna.los,
      reflection: config.sionna.reflection,
      diffraction: config.sionna.diffraction,
      scattering: config.sionna.scattering,
    },
  };
}

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
      const carPoints = car.id ? points.filter(p => p.carId === car.id) : [];
      const colorHex  = car.color ? `0x${car.color.padStart(6, '0')}` : '0x00ff00';
      const yaw       = car.rotation ? (car.rotation * 57.2958).toFixed(1) : '0.0';
      lines.push(`    - id: ${i}`);
      lines.push(`      model: ${car.model || 'vehicle.tesla.model3'}`);
      lines.push(`      color: "${colorHex}"`);
      lines.push('      spawn_position:');
      lines.push(`        - [${car.x.toFixed(2)}, ${car.y.toFixed(2)}, ${car.z.toFixed(2)}, 0.0, ${yaw}, 0.0]`);
      if (carPoints.length > 0) {
        lines.push('      destination:');
        carPoints.forEach(pt => lines.push(`        - [${pt.x.toFixed(2)}, ${pt.y.toFixed(2)}, ${pt.z.toFixed(2)}]`));
      }
      lines.push('      v2x:');
      lines.push(`        communication_range: ${config.omnet.max_interf_dist}`);
      lines.push('');
    });
  }
  if (rsus.length > 0) {
    lines.push('  rsu_list:');
    rsus.forEach((rsu, i) => {
      lines.push(`    - id: ${i}`);
      if (rsu.name) lines.push(`      name: "${rsu.name}"`);
      lines.push('      spawn_position:');
      lines.push(`        - [${rsu.x.toFixed(2)}, ${rsu.y.toFixed(2)}, ${rsu.z.toFixed(2)}, 0.0, ${(rsu.azimuth ?? 0).toFixed(1)}, 0.0]`);
      lines.push('      v2x:');
      lines.push(`        communication_range: ${rsu.range}`);
      lines.push(`        tx_power: ${rsu.tx_power}`);
      lines.push(`        frequency: ${rsu.frequency}`);
      lines.push(`        protocol: ${rsu.protocol}`);
      lines.push(`        network_protocol: ${rsu.network_protocol ?? 'GeoNetworking'}`);
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

export function generateOpenCDAConfig(
  config: SimulationConfig,
  cars: Car[],
  rsus: RSU[],
  points: Point[],
): string {
  const oc = config.opencda;
  const carla = config.carla;
  const lines: string[] = [];

  lines.push(`description: |-`);
  lines.push(`  OpenCDA scenario generated by ScenarioManager`);
  lines.push(`  Town: ${carla.map} | Vehicles: ${cars.length} | RSUs: ${rsus.length}`);
  lines.push('');

  lines.push('world:');
  lines.push(`  town: ${carla.map}`);
  lines.push(`  weather: ${carla.weather_preset}`);
  lines.push(`  fixed_delta_seconds: ${carla.fixed_delta_seconds}`);
  lines.push(`  simulation_time: ${config.sim_duration}`);
  lines.push(`  sync_mode: ${carla.synchronous_mode}`);
  lines.push('');

  lines.push('blueprint:');
  lines.push(`  use_multi_class_bp: ${oc.use_multi_class_bp}`);
  lines.push(`  bp_meta_path: "${oc.bp_meta_path}"`);
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
  if (oc.rsu_cam_num > 0) {
    lines.push('      camera:');
    lines.push(`        visualize: 0`);
    lines.push(`        num: ${oc.rsu_cam_num}`);
    lines.push('        positions:');
    lines.push('          - [2.5, 0, 1.0, 0]');
    if (oc.rsu_cam_num > 1) lines.push('          - [0.0, 0.3, 1.8, 100]');
    if (oc.rsu_cam_num > 2) lines.push('          - [0.0, -0.3, 1.8, -100]');
    if (oc.rsu_cam_num > 3) lines.push('          - [-2.0, 0.0, 1.5, 180]');
  } else {
    lines.push('      camera:');
    lines.push('        visualize: 0');
    lines.push('        num: 0');
  }
  lines.push('      lidar:');
  lines.push(`        visualize: ${oc.lidar_visualize}`);
  lines.push(`        channels: ${oc.rsu_lidar_channels}`);
  lines.push(`        range: ${oc.rsu_lidar_range}`);
  lines.push(`        points_per_second: ${oc.lidar_points_per_second}`);
  lines.push(`        rotation_frequency: ${oc.lidar_rotation_frequency}`);
  lines.push(`        upper_fov: ${oc.lidar_upper_fov}`);
  lines.push(`        lower_fov: ${oc.lidar_lower_fov}`);
  lines.push('        dropoff_general_rate: 0.3');
  lines.push('        dropoff_intensity_limit: 0.7');
  lines.push('        dropoff_zero_intensity: 0.4');
  lines.push('        noise_stddev: 0.02');
  lines.push('    localization:');
  lines.push(`      activate: ${oc.localization_activate}`);
  if (oc.localization_activate) {
    lines.push('      dt: ${world.fixed_delta_seconds}');
    lines.push('      gnss:');
    lines.push('        noise_alt_stddev: 0.05');
    lines.push('        noise_lat_stddev: 3e-6');
    lines.push('        noise_lon_stddev: 3e-6');
  }
  lines.push('');

  lines.push('vehicle_base:');
  lines.push('  sensing:');
  lines.push('    perception:');
  lines.push(`      activate: ${oc.perception_activate}`);
  lines.push('      camera:');
  lines.push('        visualize: 0');
  lines.push('        num: 1');
  lines.push('        positions:');
  lines.push('          - [2.5, 0, 1.0, 0]');
  lines.push('      lidar:');
  lines.push(`        visualize: ${oc.lidar_visualize}`);
  lines.push(`        channels: ${oc.lidar_channels}`);
  lines.push(`        range: ${oc.lidar_range}`);
  lines.push(`        points_per_second: ${oc.lidar_points_per_second}`);
  lines.push(`        rotation_frequency: ${oc.lidar_rotation_frequency}`);
  lines.push(`        upper_fov: ${oc.lidar_upper_fov}`);
  lines.push(`        lower_fov: ${oc.lidar_lower_fov}`);
  lines.push('        dropoff_general_rate: 0.3');
  lines.push('        dropoff_intensity_limit: 0.7');
  lines.push('        dropoff_zero_intensity: 0.4');
  lines.push('        noise_stddev: 0.02');
  lines.push('    localization:');
  lines.push(`      activate: ${oc.localization_activate}`);
  lines.push('      debug_helper:');
  lines.push('        show_animation: false');
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
  lines.push(`    sample_resolution: ${oc.sample_resolution}`);
  lines.push('    local_planner:');
  lines.push('      buffer_size: 12');
  lines.push('      trajectory_update_freq: 15');
  lines.push('      waypoint_update_freq: 9');
  lines.push('      min_dist: 3');
  lines.push('      trajectory_dt: 0.20');
  lines.push('      debug: false');
  lines.push('      debug_trajectory: false');
  lines.push('');

  lines.push('sumo:');
  lines.push(`  port: ${oc.sumo_port}`);
  lines.push(`  host: ${oc.sumo_host}`);
  lines.push(`  gui: ${oc.sumo_gui}`);
  lines.push(`  client_order: ${oc.sumo_client_order}`);
  lines.push(`  step_length: ${carla.fixed_delta_seconds}`);
  lines.push('');

  if (oc.enable_background_traffic) {
    lines.push('carla_traffic_manager:');
    lines.push(`  global_speed_perc: ${oc.global_speed_perc}`);
    lines.push(`  auto_lane_change: ${oc.auto_lane_change}`);
    lines.push('  random: true');
    lines.push(`  ignore_lights_percentage: ${oc.ignore_lights_percentage}`);
    lines.push('  vehicle_list: ~');
    lines.push('  range:');
    lines.push(`    - [0, 500, 0, 500, 3, 3, ${oc.bg_vehicle_num}]`);
    lines.push('');
  }

  lines.push('scenario:');

  if (rsus.length > 0) {
    lines.push('  rsu_list:');
    rsus.forEach((rsu, i) => {
      lines.push(`    - name: rsu${i + 1}`);
      lines.push(`      spawn_position: [${rsu.x.toFixed(2)}, ${rsu.y.toFixed(2)}, ${rsu.z.toFixed(2)}, 0, 0, 0]`);
      lines.push(`      id: ${i + 1}`);
      lines.push(`      # tx_power: ${rsu.tx_power} | frequency: ${rsu.frequency} | range: ${rsu.range} | protocol: ${rsu.protocol}`);
    });
  } else {
    lines.push('  rsu_list:');
  }

  if (cars.length > 0) {
    lines.push('  single_cav_list:');
    cars.forEach((car, i) => {
      const yawDeg = car.rotation ? (car.rotation * 57.2958).toFixed(1) : '0.0';
      const carPoints = car.id ? points.filter(p => p.carId === car.id) : [];
      lines.push(`    - name: cav${i + 1}`);
      lines.push(`      spawn_position: [${car.x.toFixed(2)}, ${car.y.toFixed(2)}, ${car.z.toFixed(2)}, 0, ${yawDeg}, 0]`);
      if (carPoints.length > 0) {
        const dest = carPoints[carPoints.length - 1];
        lines.push(`      destination: [${dest.x.toFixed(2)}, ${dest.y.toFixed(2)}, ${dest.z.toFixed(2)}]`);
      }
      lines.push(`      id: ${i + 1}`);
      lines.push(`      # model: ${car.model || 'vehicle.tesla.model3'} | speed: ${car.speed ?? oc.max_speed} km/h`);
    });
  } else {
    lines.push('  single_cav_list:');
  }

  return lines.join('\n');
}

export function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
