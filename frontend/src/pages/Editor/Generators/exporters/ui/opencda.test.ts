import { describe, it, expect } from 'vitest';
import { useGenerateOpenCDAConfig } from './opencda';
import { defaultSimConfig } from '../../types/configGeneratorsTypes';
import { Car, RSU, Lidar, Point } from '@/store/types/useEditorStoreTypes';

const makeCar = (overrides: Partial<Car> = {}): Car =>
  ({
    id: 'car-1',
    x: 1.005,
    y: 2.004,
    z: 0,
    color: 'ffffff',
    model: 'vehicle.tesla.model3',
    scale: 1,
    rotation: 0,
    speed: 0,
    ...overrides,
  }) as Car;

const makeRSU = (overrides: Partial<RSU> = {}): RSU =>
  ({
    id: 'rsu-1',
    name: 'RSU 1',
    x: 1,
    y: 2,
    z: 3,
    tx_power: 23,
    frequency: 5.9e9,
    range: 300,
    protocol: 'ITS-G5',
    network_protocol: 'GeoNetworking',
    antenna_type: 'isotropic',
    antenna_height: 5,
    antenna_gain: 0,
    polarization: 'vertical',
    mimo_rows: 1,
    mimo_columns: 1,
    element_spacing: 0.5,
    azimuth: 0,
    tilt: 0,
    cam_interval: 100,
    beacon_interval: 100,
    scenario: '',
    ...overrides,
  }) as RSU;

const makeLidar = (overrides: Partial<Lidar> = {}): Lidar =>
  ({
    id: 'l1',
    carId: 'car-1',
    x: 0,
    y: 0,
    z: 1,
    rotation: 0,
    range: 50,
    channels: 32,
    rotation_frequency: 20,
    ...overrides,
  }) as Lidar;

const makePoint = (overrides: Partial<Point> = {}): Point =>
  ({
    id: 'p1',
    carId: 'car-1',
    x: 0,
    y: 0,
    z: 0,
    ...overrides,
  }) as Point;

describe('useGenerateOpenCDAConfig: additional coverage', () => {
  it('handles points for destination', () => {
    const car = makeCar({ id: 'car-1', x: 10, y: 20, z: 0 });
    const point = makePoint({ id: 'p1', carId: 'car-1', x: 100, y: 200, z: 0 });

    const yaml = useGenerateOpenCDAConfig(defaultSimConfig, [car], [], [point]);

    expect(yaml).toContain('destination: [100.00, 200.00, 0.00]');
  });

  it('handles lidar attached to car', () => {
    const car = makeCar({ id: 'car-1' });
    const lidar = makeLidar({ carId: 'car-1', range: 100, channels: 64 });

    const yaml = useGenerateOpenCDAConfig(
      defaultSimConfig,
      [car],
      [],
      [],
      [lidar],
    );

    expect(yaml).toContain('lidar:');
    expect(yaml).toContain('range: 100');
    expect(yaml).toContain('channels: 64');
  });

  it('handles car with opencda_spawn_special', () => {
    const car = makeCar({
      id: 'car-1',
      opencda_spawn_special: 123,
    });

    const yaml = useGenerateOpenCDAConfig(defaultSimConfig, [car], [], []);

    expect(yaml).toContain('spawn_special: [123]');
    expect(yaml).not.toContain('spawn_position:');
  });

  it('handles RSU with opencda_behavior_services', () => {
    const rsu = makeRSU({
      id: 'rsu-1',
      opencda_behavior_services: [
        {
          type: 'aim_server' as const,
          debug: true,
          control_radius: 50,
          control_center_location: { x: 1, y: 2, z: 3 },
          model: 'model_v1',
          underling_model: 'underling_v1',
          hidden_channels: 128,
          weight: 'weights.pth',
          priority: 1,
        },
      ],
    });

    const yaml = useGenerateOpenCDAConfig(defaultSimConfig, [], [rsu], []);

    expect(yaml).toContain('behavior_services:');
    expect(yaml).toContain('type: aim_server');
    expect(yaml).toContain('debug: true');
    expect(yaml).toContain('control_radius: 50');
    expect(yaml).toContain('control_center_location:');
    expect(yaml).toContain('x: 1');
    expect(yaml).toContain('y: 2');
    expect(yaml).toContain('z: 3');
    expect(yaml).toContain('model: model_v1');
    expect(yaml).toContain('underling_model: underling_v1');
    expect(yaml).toContain('hidden_channels: 128');
    expect(yaml).toContain('weight: weights.pth');
    expect(yaml).toContain('priority: 1');
  });

  it('handles RSU with empty behavior_services', () => {
    const rsu = makeRSU({
      id: 'rsu-1',
      opencda_behavior_services: [],
    });

    const yaml = useGenerateOpenCDAConfig(defaultSimConfig, [], [rsu], []);

    expect(yaml).not.toContain('behavior_services:');
  });

  it('handles car with opencda_v2x configuration', () => {
    const car = makeCar({
      id: 'car-1',
      opencda_v2x: {
        enabled: false,
        communication_range: 100,
      },
    });

    const yaml = useGenerateOpenCDAConfig(defaultSimConfig, [car], [], []);

    expect(yaml).toContain('v2x:');
    expect(yaml).toContain('enabled: false');
    expect(yaml).toContain('communication_range: 100');
  });

  it('handles car with behavior override values', () => {
    const car = makeCar({
      id: 'car-1',
      opencda_max_speed: 30,
      opencda_ignore_traffic_light: false,
      opencda_overtake_allowed: false,
      opencda_collision_time_ahead: 2.5,
      opencda_local_planner_debug: true,
      opencda_local_planner_debug_trajectory: false,
    });

    const yaml = useGenerateOpenCDAConfig(defaultSimConfig, [car], [], []);

    expect(yaml).toContain('behavior:');
    expect(yaml).toContain('max_speed: 30');
    expect(yaml).toContain('ignore_traffic_light: false');
    expect(yaml).toContain('overtake_allowed: false');
    expect(yaml).toContain('collision_time_ahead: 2.5');
    expect(yaml).toContain('local_planner:');
    expect(yaml).toContain('debug: true');
    expect(yaml).toContain('debug_trajectory: false');
  });

  it('handles car with opencda_behavior_services', () => {
    const car = makeCar({
      id: 'car-1',
      opencda_behavior_services: [
        { type: 'self_informer' as const },
        { type: 'aim_client' as const, debug: true },
        { type: 'movement_controller' as const },
      ],
    });

    const yaml = useGenerateOpenCDAConfig(defaultSimConfig, [car], [], []);

    expect(yaml).toContain('behavior_services:');
    expect(yaml).toContain('type: self_informer');
    expect(yaml).toContain('type: aim_client');
    expect(yaml).toContain('debug: true');
    expect(yaml).toContain('type: movement_controller');
  });

  it('handles car with opencda_name', () => {
    const car = makeCar({
      id: 'car-1',
      opencda_name: 'Tesla Model 3',
    });

    const yaml = useGenerateOpenCDAConfig(defaultSimConfig, [car], [], []);

    expect(yaml).toContain('name: "Tesla Model 3"');
  });

  it('handles car with opencda_carla_model', () => {
    const car = makeCar({
      id: 'car-1',
      opencda_carla_model: 'vehicle.tesla.model3',
    });

    const yaml = useGenerateOpenCDAConfig(defaultSimConfig, [car], [], []);

    expect(yaml).toContain('model: vehicle.tesla.model3');
  });

  it('handles RSU with opencda_name and opencda_color', () => {
    const rsu = makeRSU({
      id: 'rsu-1',
      opencda_name: 'Main RSU',
      opencda_color: [255, 0, 0] as [number, number, number],
    });

    const yaml = useGenerateOpenCDAConfig(defaultSimConfig, [], [rsu], []);

    expect(yaml).toContain('name: "Main RSU"');
    expect(yaml).toContain('color: [255, 0, 0]');
  });

  it('handles nested array of arrays in attacks', () => {
    const config = {
      ...defaultSimConfig,
      opencda: { ...defaultSimConfig.opencda, export_attacks: true },
      attacks: [
        {
          name: 'attack-1',
          params: {
            matrix: [
              [1, 2, 3],
              [4, 5, 6],
            ],
          },
        },
      ],
    };

    const yaml = useGenerateOpenCDAConfig(config, [], [], []);

    expect(yaml).toContain('matrix:');
    expect(yaml).toContain('- 1');
    expect(yaml).toContain('- 2');
    expect(yaml).toContain('- 3');
    expect(yaml).toContain('- 4');
    expect(yaml).toContain('- 5');
    expect(yaml).toContain('- 6');
  });

  it('handles car with opencda_color', () => {
    const car = makeCar({
      id: 'car-1',
      opencda_color: [0, 255, 0] as [number, number, number],
    });

    const yaml = useGenerateOpenCDAConfig(defaultSimConfig, [car], [], []);

    expect(yaml).toContain('color: [0, 255, 0]');
  });

  it('handles export_platoon_base and export_coop_perception', () => {
    const config = {
      ...defaultSimConfig,
      opencda: {
        ...defaultSimConfig.opencda,
        export_platoon_base: true,
        export_coop_perception: true,
      },
    };

    const yaml = useGenerateOpenCDAConfig(config, [], [], []);

    expect(yaml).toContain('platoon_base:');
    expect(yaml).toContain('cooperative_perception_visualization:');
    expect(yaml).toContain('background: [17, 34, 42]');
    expect(yaml).toContain('bbox_line_thickness: 3');
    expect(yaml).toContain('image_dpi: 600');
  });

  it('handles RSU with all sensing overrides', () => {
    const rsu = makeRSU({
      id: 'rsu-1',
      opencda_sensing: {
        perception_activate: true,
        detection_range: 200,
        camera_visualize: 1,
        camera_num: 2,
        camera_positions: [
          [1, 2, 3, 4] as [number, number, number, number],
          [5, 6, 7, 8] as [number, number, number, number],
        ],
        lidar_visualize: true,
        lidar_channels: 64,
        lidar_range: 150,
        lidar_points_per_second: 200000,
        lidar_rotation_frequency: 30,
        lidar_upper_fov: 15,
        lidar_lower_fov: -25,
        lidar_dropoff_general_rate: 0.5,
        lidar_dropoff_intensity_limit: 0.8,
        lidar_dropoff_zero_intensity: 0.1,
        lidar_noise_stddev: 0.5,
        localization_activate: false,
        gnss_noise_alt_stddev: 0.002,
        gnss_noise_lat_stddev: 0.000002,
        gnss_noise_lon_stddev: 0.000002,
      },
    });

    const yaml = useGenerateOpenCDAConfig(defaultSimConfig, [], [rsu], []);

    expect(yaml).toContain('activate: true');
    expect(yaml).toContain('detection_range: 200');
    expect(yaml).toContain('camera:');
    expect(yaml).toContain('visualize: 1');
    expect(yaml).toContain('num: 2');
    expect(yaml).toContain('positions:');
    expect(yaml).toContain('[1, 2, 3, 4]');
    expect(yaml).toContain('[5, 6, 7, 8]');
    expect(yaml).toContain('lidar:');
    expect(yaml).toContain('visualize: true');
    expect(yaml).toContain('channels: 64');
    expect(yaml).toContain('range: 150');
    expect(yaml).toContain('localization:');
    expect(yaml).toContain('activate: false');
    expect(yaml).toContain('noise_alt_stddev: 0.002');
  });
});

describe('useGenerateOpenCDAConfig: coverage for numeric IDs', () => {
  it('uses opencda_id for car when provided', () => {
    const car = makeCar({
      id: 'car-1',
      opencda_id: 42,
    });

    const yaml = useGenerateOpenCDAConfig(defaultSimConfig, [car], [], []);

    expect(yaml).toContain('id: 42');
  });

  it('parses numeric id from car id when opencda_id is not provided', () => {
    const car = makeCar({
      id: '123',
    });

    const yaml = useGenerateOpenCDAConfig(defaultSimConfig, [car], [], []);

    expect(yaml).toContain('id: 123');
  });

  it('generates fallback id for car when id is not numeric and opencda_id is not provided', () => {
    const car1 = makeCar({ id: 'car-a' });
    const car2 = makeCar({ id: 'car-b' });

    const yaml = useGenerateOpenCDAConfig(
      defaultSimConfig,
      [car1, car2],
      [],
      [],
    );

    expect(yaml).toContain('id: 100');
    expect(yaml).toContain('id: 200');
  });

  it('uses opencda_id for RSU when provided (aimStyle false)', () => {
    const rsu = makeRSU({
      id: 'rsu-1',
      opencda_id: 10,
    });

    const yaml = useGenerateOpenCDAConfig(defaultSimConfig, [], [rsu], []);

    expect(yaml).toContain('id: 10');
  });

  it('uses opencda_id for RSU when provided (aimStyle true)', () => {
    const config = {
      ...defaultSimConfig,
      opencda: {
        ...defaultSimConfig.opencda,
        export_profile: 'aim_check' as const,
      },
    };
    const rsu = makeRSU({
      id: 'rsu-1',
      opencda_id: 10,
    });

    const yaml = useGenerateOpenCDAConfig(config, [], [rsu], []);

    expect(yaml).toContain('id: 10');
  });

  it('generates negative id for RSU when aimStyle is false', () => {
    const rsu = makeRSU({ id: 'rsu-1' });

    const yaml = useGenerateOpenCDAConfig(defaultSimConfig, [], [rsu], []);

    expect(yaml).toContain('id: -1');
  });

  it('generates positive id for RSU when aimStyle is true', () => {
    const config = {
      ...defaultSimConfig,
      opencda: {
        ...defaultSimConfig.opencda,
        export_profile: 'aim_check' as const,
      },
    };
    const rsu = makeRSU({ id: 'rsu-1' });

    const yaml = useGenerateOpenCDAConfig(config, [], [rsu], []);

    expect(yaml).toContain('id: 1');
  });

  it('uses opencda_name for car display name', () => {
    const car = makeCar({
      id: 'car-1',
      opencda_name: 'My Custom Car',
    });

    const yaml = useGenerateOpenCDAConfig(defaultSimConfig, [car], [], []);

    expect(yaml).toContain('name: "My Custom Car"');
  });

  it('uses opencda_name for RSU display name', () => {
    const rsu = makeRSU({
      id: 'rsu-1',
      opencda_name: 'My Custom RSU',
    });

    const yaml = useGenerateOpenCDAConfig(defaultSimConfig, [], [rsu], []);

    expect(yaml).toContain('name: "My Custom RSU"');
  });
});

describe('useGenerateOpenCDAConfig: specific line coverage', () => {
  it('calls rsuNumericId for each RSU in standard profile', () => {
    const rsus = [
      makeRSU({ id: 'rsu-1' }),
      makeRSU({ id: 'rsu-2' }),
      makeRSU({ id: 'rsu-3' }),
    ];

    const yaml = useGenerateOpenCDAConfig(defaultSimConfig, [], rsus, []);

    expect(yaml).toContain('id: -1');
    expect(yaml).toContain('id: -2');
    expect(yaml).toContain('id: -3');
    expect(yaml).toContain('rsu_list:');
  });

  it('calls rsuNumericId for each RSU in aim_check profile', () => {
    const config = {
      ...defaultSimConfig,
      opencda: {
        ...defaultSimConfig.opencda,
        export_profile: 'aim_check' as const,
      },
    };
    const rsus = [makeRSU({ id: 'rsu-1' }), makeRSU({ id: 'rsu-2' })];

    const yaml = useGenerateOpenCDAConfig(config, [], rsus, []);

    expect(yaml).toContain('id: 1');
    expect(yaml).toContain('id: 2');
  });

  it('triggers pushCavSensingOverride with lidar attached to car', () => {
    const car = makeCar({ id: 'car-1' });
    const lidar = makeLidar({
      carId: 'car-1',
      range: 100,
      channels: 64,
      rotation_frequency: 30,
      x: 0,
      y: 0,
      z: 1.5,
      rotation: 0,
    });

    const yaml = useGenerateOpenCDAConfig(
      defaultSimConfig,
      [car],
      [],
      [],
      [lidar],
    );

    expect(yaml).toContain('lidar:');
    expect(yaml).toContain('range: 100');
    expect(yaml).toContain('channels: 64');
    expect(yaml).toContain('rotation_frequency: 30');
  });

  it('handles opencda_v2x configuration for car', () => {
    const car = makeCar({
      id: 'car-1',
      opencda_v2x: {
        enabled: true,
        communication_range: 200,
      },
    });

    const yaml = useGenerateOpenCDAConfig(defaultSimConfig, [car], [], []);

    expect(yaml).toContain('v2x:');
    expect(yaml).toContain('enabled: true');
    expect(yaml).toContain('communication_range: 200');
  });

  it('handles opencda_behavior_services for car', () => {
    const car = makeCar({
      id: 'car-1',
      opencda_behavior_services: [
        { type: 'self_informer' as const },
        { type: 'aim_client' as const, debug: true },
        { type: 'movement_controller' as const },
      ],
    });

    const yaml = useGenerateOpenCDAConfig(defaultSimConfig, [car], [], []);

    expect(yaml).toContain('behavior_services:');
    expect(yaml).toContain('type: self_informer');
    expect(yaml).toContain('type: aim_client');
    expect(yaml).toContain('debug: true');
    expect(yaml).toContain('type: movement_controller');
  });

  it('handles behavior override for car', () => {
    const car = makeCar({
      id: 'car-1',
      opencda_max_speed: 25,
      opencda_ignore_traffic_light: false,
      opencda_overtake_allowed: false,
      opencda_collision_time_ahead: 3.0,
      opencda_local_planner_debug: true,
      opencda_local_planner_debug_trajectory: false,
    });

    const yaml = useGenerateOpenCDAConfig(defaultSimConfig, [car], [], []);

    expect(yaml).toContain('behavior:');
    expect(yaml).toContain('max_speed: 25');
    expect(yaml).toContain('ignore_traffic_light: false');
    expect(yaml).toContain('overtake_allowed: false');
    expect(yaml).toContain('collision_time_ahead: 3');
    expect(yaml).toContain('debug: true');
    expect(yaml).toContain('debug_trajectory: false');
  });

  it('handles opencda_spawn_special for car', () => {
    const car = makeCar({
      id: 'car-1',
      opencda_spawn_special: 5,
      x: 10,
      y: 20,
      z: 0,
    });

    const yaml = useGenerateOpenCDAConfig(defaultSimConfig, [car], [], []);

    expect(yaml).toContain('spawn_special: [5]');
    expect(yaml).not.toContain('spawn_position:');
  });

  it('handles opencda_name for car', () => {
    const car = makeCar({
      id: 'car-1',
      opencda_name: 'Custom Car Name',
    });

    const yaml = useGenerateOpenCDAConfig(defaultSimConfig, [car], [], []);

    expect(yaml).toContain('name: "Custom Car Name"');
  });

  it('handles opencda_carla_model for car', () => {
    const car = makeCar({
      id: 'car-1',
      opencda_carla_model: 'vehicle.tesla.model3',
    });

    const yaml = useGenerateOpenCDAConfig(defaultSimConfig, [car], [], []);

    expect(yaml).toContain('model: vehicle.tesla.model3');
  });
});
