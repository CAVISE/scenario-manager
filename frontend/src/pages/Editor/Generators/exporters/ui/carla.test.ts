import { describe, it, expect } from 'vitest';
import { generateCarlaYaml } from './carla';
import { Car, RSU, Point } from '@/store/types/useEditorStoreTypes';
import { defaultSimConfig } from '../../types/configGeneratorsTypes';

const makeCar = (overrides: Partial<Car> = {}): Car =>
  ({
    id: 'car-1',
    x: 1.005,
    y: 2.004,
    z: 0,
    color: 'ff0000',
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

const makePoint = (overrides: Partial<Point> = {}): Point =>
  ({
    id: 'p1',
    carId: 'car-1',
    x: 0,
    y: 0,
    z: 0,
    ...overrides,
  }) as Point;

describe('generateCarlaYaml', () => {
  it('renders world and traffic_manager fields from config.carla', () => {
    const yaml = generateCarlaYaml(defaultSimConfig, [], [], []);

    expect(yaml).toContain(`town: ${defaultSimConfig.carla.map}`);
    expect(yaml).toContain(`weather: ${defaultSimConfig.carla.weather_preset}`);
    expect(yaml).toContain(
      `sync_mode: ${defaultSimConfig.carla.synchronous_mode}`
    );
    expect(yaml).toContain(
      `fixed_delta_seconds: ${defaultSimConfig.carla.fixed_delta_seconds}`
    );
    expect(yaml).toContain(
      `client_port: ${defaultSimConfig.carla.client_port}`
    );
    expect(yaml).toContain(`seed: ${defaultSimConfig.carla.seed}`);
    expect(yaml).toContain(`simulation_time: ${defaultSimConfig.sim_duration}`);
    expect(yaml).toContain(
      `port: ${defaultSimConfig.carla.traffic_manager_port}`
    );
    expect(yaml).toContain(
      `num_vehicles: ${defaultSimConfig.carla.num_vehicles}`
    );
    expect(yaml).toContain(
      `num_pedestrians: ${defaultSimConfig.carla.num_pedestrians}`
    );
  });

  it('omits single_cav_list and rsu_list entirely when there are no cars or RSUs', () => {
    const yaml = generateCarlaYaml(defaultSimConfig, [], [], []);

    expect(yaml).not.toContain('single_cav_list');
    expect(yaml).not.toContain('rsu_list');
  });

  describe('cars', () => {
    it('emits a single_cav_list entry per car with id, model, color, and spawn_position', () => {
      const yaml = generateCarlaYaml(
        defaultSimConfig,
        [makeCar({ model: 'vehicle.audi.a2', color: '00ff00' })],
        [],
        []
      );

      expect(yaml).toContain('single_cav_list:');
      expect(yaml).toContain('- id: 0');
      expect(yaml).toContain('model: vehicle.audi.a2');
      expect(yaml).toContain('color: "0x00ff00"');
    });

    it('falls back to vehicle.tesla.model3 when model is empty', () => {
      const yaml = generateCarlaYaml(
        defaultSimConfig,
        [makeCar({ model: '' })],
        [],
        []
      );

      expect(yaml).toContain('model: vehicle.tesla.model3');
    });

    it('falls back to 0x00ff00 when color is empty', () => {
      const yaml = generateCarlaYaml(
        defaultSimConfig,
        [makeCar({ color: '' })],
        [],
        []
      );

      expect(yaml).toContain('color: "0x00ff00"');
    });

    it('left-pads a short color hex to 6 digits', () => {
      const yaml = generateCarlaYaml(
        defaultSimConfig,
        [makeCar({ color: 'f0' })],
        [],
        []
      );

      expect(yaml).toContain('color: "0x0000f0"');
    });

    it('formats the spawn position with x, y, z rounded to 2 decimals and yaw = 0.0 when rotation is 0', () => {
      const yaml = generateCarlaYaml(
        defaultSimConfig,
        [makeCar({ x: 1.005, y: 2.004, z: 0, rotation: 0 })],
        [],
        []
      );

      expect(yaml).toContain('[1.00, 2.00, 0.00, 0.0, 0.0, 0.0]');
    });

    it('converts a non-zero rotation from radians to degrees for yaw', () => {
      const yaml = generateCarlaYaml(
        defaultSimConfig,
        [makeCar({ rotation: Math.PI / 2 })],
        [],
        []
      );

      expect(yaml).toContain(', 90.0, 0.0]');
    });

    it('includes a destination block only with points belonging to that car', () => {
      const yaml = generateCarlaYaml(
        defaultSimConfig,
        [makeCar({ id: 'car-1' })],
        [],
        [
          makePoint({ carId: 'car-1', x: 5, y: 6, z: 0 }),
          makePoint({ carId: 'car-1', x: 7, y: 8, z: 0 }),
          makePoint({ carId: 'other-car', x: 99, y: 99, z: 0 }),
        ]
      );

      expect(yaml).toContain('destination:');
      expect(yaml).toContain('[5.00, 6.00, 0.00]');
      expect(yaml).toContain('[7.00, 8.00, 0.00]');
      expect(yaml).not.toContain('[99.00, 99.00, 0.00]');
    });

    it('omits the destination block when the car has no points', () => {
      const yaml = generateCarlaYaml(
        defaultSimConfig,
        [makeCar({ id: 'car-1' })],
        [],
        []
      );

      expect(yaml).not.toContain('destination:');
    });

    it('treats a falsy car.id as having no points at all, even if points array is non-empty', () => {
      const yaml = generateCarlaYaml(
        defaultSimConfig,
        [makeCar({ id: '' })],
        [],
        [makePoint({ carId: '' })]
      );

      expect(yaml).not.toContain('destination:');
    });

    it('sets v2x communication_range from config.omnet.max_interf_dist for every car', () => {
      const config = {
        ...defaultSimConfig,
        omnet: { ...defaultSimConfig.omnet, max_interf_dist: 1234 },
      };

      const yaml = generateCarlaYaml(config, [makeCar()], [], []);

      expect(yaml).toContain('communication_range: 1234');
    });

    it('indexes multiple cars sequentially', () => {
      const yaml = generateCarlaYaml(
        defaultSimConfig,
        [makeCar({ id: 'car-1' }), makeCar({ id: 'car-2' })],
        [],
        []
      );

      expect(yaml).toContain('- id: 0');
      expect(yaml).toContain('- id: 1');
    });
  });

  describe('RSUs', () => {
    it('emits an rsu_list entry with id, position, and v2x/antenna fields', () => {
      const yaml = generateCarlaYaml(
        defaultSimConfig,
        [],
        [
          makeRSU({
            range: 400,
            tx_power: 30,
            frequency: 5.9e9,
            protocol: 'C-V2X',
          }),
        ],
        []
      );

      expect(yaml).toContain('rsu_list:');
      expect(yaml).toContain('- id: 0');
      expect(yaml).toContain('communication_range: 400');
      expect(yaml).toContain('tx_power: 30');
      expect(yaml).toContain('frequency: 5900000000');
      expect(yaml).toContain('protocol: C-V2X');
    });

    it('includes a name line only when the RSU has a truthy name', () => {
      const withName = generateCarlaYaml(
        defaultSimConfig,
        [],
        [makeRSU({ name: 'Junction RSU' })],
        []
      );
      const withoutName = generateCarlaYaml(
        defaultSimConfig,
        [],
        [makeRSU({ name: '' })],
        []
      );

      expect(withName).toContain('name: "Junction RSU"');
      expect(withoutName).not.toContain('name: ""');
      expect(withoutName).not.toContain('      name:');
    });

    it('falls back to sane antenna/network defaults when optional fields are missing', () => {
      const rsu = makeRSU();
      delete (rsu as Partial<RSU>).network_protocol;
      delete (rsu as Partial<RSU>).antenna_type;
      delete (rsu as Partial<RSU>).antenna_height;
      delete (rsu as Partial<RSU>).antenna_gain;
      delete (rsu as Partial<RSU>).polarization;
      delete (rsu as Partial<RSU>).cam_interval;

      const yaml = generateCarlaYaml(defaultSimConfig, [], [rsu], []);

      expect(yaml).toContain('network_protocol: GeoNetworking');
      expect(yaml).toContain('type: isotropic');
      expect(yaml).toContain('height: 5');
      expect(yaml).toContain('gain: 0');
      expect(yaml).toContain('polarization: vertical');
      expect(yaml).toContain('cam_interval: 100');
    });

    it('uses the provided antenna/network fields instead of the fallback when present', () => {
      const yaml = generateCarlaYaml(
        defaultSimConfig,
        [],
        [
          makeRSU({
            network_protocol: 'BTP',
            antenna_type: 'dipole',
            antenna_height: 15,
            antenna_gain: 6,
            polarization: 'horizontal',
            cam_interval: 500,
          }),
        ],
        []
      );

      expect(yaml).toContain('network_protocol: BTP');
      expect(yaml).toContain('type: dipole');
      expect(yaml).toContain('height: 15');
      expect(yaml).toContain('gain: 6');
      expect(yaml).toContain('polarization: horizontal');
      expect(yaml).toContain('cam_interval: 500');
    });

    it('formats the spawn position with azimuth from rsu.azimuth, defaulting to 0', () => {
      const rsu = makeRSU({ x: 1, y: 2, z: 3, azimuth: 45 });
      const yaml = generateCarlaYaml(defaultSimConfig, [], [rsu], []);

      expect(yaml).toContain('[1.00, 2.00, 3.00, 0.0, 45.0, 0.0]');
    });

    it('defaults azimuth to 0.0 when the field is missing entirely', () => {
      const rsu = makeRSU({ x: 1, y: 2, z: 3 });
      delete (rsu as Partial<RSU>).azimuth;

      const yaml = generateCarlaYaml(defaultSimConfig, [], [rsu], []);

      expect(yaml).toContain('[1.00, 2.00, 3.00, 0.0, 0.0, 0.0]');
    });
  });

  describe('sensors', () => {
    const sensorConfig = (
      overrides: Partial<typeof defaultSimConfig.carla.sensors>
    ) => ({
      ...defaultSimConfig,
      carla: {
        ...defaultSimConfig.carla,
        sensors: { ...defaultSimConfig.carla.sensors, ...overrides },
      },
    });

    it('always emits the sensor: header even with every sensor disabled', () => {
      const config = sensorConfig({
        camera: false,
        lidar: false,
        radar: false,
        gnss: false,
        imu: false,
      });

      const yaml = generateCarlaYaml(config, [], [], []);

      expect(yaml).toContain('sensor:');
      expect(yaml).not.toContain('camera:');
      expect(yaml).not.toContain('lidar:');
      expect(yaml).not.toContain('radar:');
      expect(yaml).not.toContain('gnss:');
      expect(yaml).not.toContain('imu:');
    });

    it('emits a camera block using config.carla.camera_fov when camera is enabled', () => {
      const config = sensorConfig({ camera: true });
      const configuredWithFov = {
        ...config,
        carla: { ...config.carla, camera_fov: 100 },
      };

      const yaml = generateCarlaYaml(configuredWithFov, [], [], []);

      expect(yaml).toContain('camera:');
      expect(yaml).toContain('fov: 100');
      expect(yaml).toContain('name: front_camera');
    });

    it('emits a lidar block using channels/range when lidar is enabled', () => {
      const config = sensorConfig({ lidar: true });
      const configured = {
        ...config,
        carla: { ...config.carla, lidar_channels: 64, lidar_range: 120 },
      };

      const yaml = generateCarlaYaml(configured, [], [], []);

      expect(yaml).toContain('lidar:');
      expect(yaml).toContain('channels: 64');
      expect(yaml).toContain('range: 120');
    });

    it('emits a radar block with fixed fields when radar is enabled', () => {
      const config = sensorConfig({ radar: true });

      const yaml = generateCarlaYaml(config, [], [], []);

      expect(yaml).toContain('radar:');
      expect(yaml).toContain('name: radar');
    });

    it('emits a gnss block when gnss is enabled', () => {
      const config = sensorConfig({ gnss: true });

      const yaml = generateCarlaYaml(config, [], [], []);

      expect(yaml).toContain('gnss:');
      expect(yaml).toContain('name: gnss');
    });

    it('emits an imu block when imu is enabled', () => {
      const config = sensorConfig({ imu: true });

      const yaml = generateCarlaYaml(config, [], [], []);

      expect(yaml).toContain('imu:');
      expect(yaml).toContain('name: imu');
    });

    it('emits every sensor block when all are enabled', () => {
      const config = sensorConfig({
        camera: true,
        lidar: true,
        radar: true,
        gnss: true,
        imu: true,
      });

      const yaml = generateCarlaYaml(config, [], [], []);

      expect(yaml).toContain('camera:');
      expect(yaml).toContain('lidar:');
      expect(yaml).toContain('radar:');
      expect(yaml).toContain('gnss:');
      expect(yaml).toContain('imu:');
    });
  });
});
