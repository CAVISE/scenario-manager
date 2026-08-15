import { describe, it, expect } from 'vitest';
import { generateSionnaConfig } from './sionna';
import { defaultSimConfig } from '../../types/configGeneratorsTypes';
import type {
  Building,
  Car,
  RSU,
} from '../../../../../store/types/useEditorStoreTypes';

type SionnaOutput = {
  scene: { carrier_frequency: number; synthetic_array: boolean };
  transmitters: Array<{
    name: string;
    position: number[];
    frequency: number;
    antenna: {
      type: string;
      height: number;
      gain: number;
      polarization: string;
      orientation: { azimuth: number; tilt: number };
      array: { rows: number; columns: number; element_spacing: number };
    };
  }>;
  receivers: Array<{ name: string; position: number[] }>;
  buildings: Array<{
    name: string;
    position: number[];
    width: number;
    depth: number;
    height: number;
    material: string;
  }>;
  ray_tracing: {
    method: string;
    num_samples: number;
    max_depth: number;
    los: boolean;
    reflection: boolean;
    diffraction: boolean;
    scattering: boolean;
  };
};

const makeRSU = (overrides: Partial<RSU> = {}): RSU =>
  ({
    id: 'rsu-1',
    name: 'RSU 1',
    x: 1.005,
    y: 2.004,
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

const makeCar = (overrides: Partial<Car> = {}): Car =>
  ({
    id: 'car-1',
    x: 0,
    y: 0,
    z: 0,
    color: 'ffffff',
    model: 'vehicle.tesla.model3',
    scale: 1,
    rotation: 0,
    speed: 0,
    ...overrides,
  }) as Car;

const makeBuilding = (overrides: Partial<Building> = {}): Building =>
  ({
    id: 'b1',
    name: 'Building 1',
    x: 0,
    y: 0,
    z: 0,
    width: 20,
    depth: 20,
    height: 10,
    scale: 1,
    rotation: 0,
    material: 'concrete',
    ...overrides,
  }) as Building;

describe('generateSionnaConfig', () => {
  it('maps the scene and ray_tracing sections directly from config.sionna', () => {
    const result = generateSionnaConfig(
      defaultSimConfig,
      [],
      [],
      [],
    ) as SionnaOutput;

    expect(result.scene).toEqual({
      carrier_frequency: defaultSimConfig.sionna.carrier_frequency,
      synthetic_array: true,
    });
    expect(result.ray_tracing).toEqual({
      method: 'fibonacci',
      num_samples: defaultSimConfig.sionna.num_samples,
      max_depth: defaultSimConfig.sionna.max_depth,
      los: defaultSimConfig.sionna.los,
      reflection: defaultSimConfig.sionna.reflection,
      diffraction: defaultSimConfig.sionna.diffraction,
      scattering: defaultSimConfig.sionna.scattering,
    });
  });

  it('returns empty arrays for transmitters/receivers/buildings when none are given', () => {
    const result = generateSionnaConfig(
      defaultSimConfig,
      [],
      [],
      [],
    ) as SionnaOutput;

    expect(result.transmitters).toEqual([]);
    expect(result.receivers).toEqual([]);
    expect(result.buildings).toEqual([]);
  });

  describe('transmitters (RSUs)', () => {
    it('uses the RSU name when set', () => {
      const result = generateSionnaConfig(
        defaultSimConfig,
        [makeRSU({ name: 'Custom RSU' })],
        [],
        [],
      ) as SionnaOutput;

      expect(result.transmitters[0].name).toBe('Custom RSU');
    });

    it('falls back to rsu_{index} when the name is an empty string', () => {
      const result = generateSionnaConfig(
        defaultSimConfig,
        [makeRSU({ name: '' }), makeRSU({ name: '' })],
        [],
        [],
      ) as SionnaOutput;

      expect(result.transmitters[0].name).toBe('rsu_0');
      expect(result.transmitters[1].name).toBe('rsu_1');
    });

    it('rounds position coordinates to 2 decimals and returns them as numbers, not strings', () => {
      const result = generateSionnaConfig(
        defaultSimConfig,
        [makeRSU({ x: 1.005, y: 2.004, z: 3.999 })],
        [],
        [],
      ) as SionnaOutput;

      const [x, y, z] = result.transmitters[0].position;
      expect(typeof x).toBe('number');
      expect(y).toBe(2);
      expect(z).toBe(4);
    });

    it('uses the RSU frequency as-is', () => {
      const result = generateSionnaConfig(
        defaultSimConfig,
        [makeRSU({ frequency: 5.9e9 })],
        [],
        [],
      ) as SionnaOutput;

      expect(result.transmitters[0].frequency).toBe(5.9e9);
    });

    it('falls back to default antenna values when optional fields are missing', () => {
      const rsu = makeRSU();
      delete (rsu as Partial<RSU>).antenna_type;
      delete (rsu as Partial<RSU>).antenna_height;
      delete (rsu as Partial<RSU>).antenna_gain;
      delete (rsu as Partial<RSU>).polarization;
      delete (rsu as Partial<RSU>).azimuth;
      delete (rsu as Partial<RSU>).tilt;
      delete (rsu as Partial<RSU>).mimo_rows;
      delete (rsu as Partial<RSU>).mimo_columns;
      delete (rsu as Partial<RSU>).element_spacing;

      const result = generateSionnaConfig(
        defaultSimConfig,
        [rsu],
        [],
        [],
      ) as SionnaOutput;

      expect(result.transmitters[0].antenna).toEqual({
        type: 'isotropic',
        height: 5,
        gain: 0,
        polarization: 'vertical',
        orientation: { azimuth: 0, tilt: 0 },
        array: { rows: 1, columns: 1, element_spacing: 0.5 },
      });
    });

    it('uses the provided antenna values instead of the fallback when present', () => {
      const result = generateSionnaConfig(
        defaultSimConfig,
        [
          makeRSU({
            antenna_type: 'dipole',
            antenna_height: 12,
            antenna_gain: 4,
            polarization: 'horizontal',
            azimuth: 45,
            tilt: 10,
            mimo_rows: 2,
            mimo_columns: 4,
            element_spacing: 0.75,
          }),
        ],
        [],
        [],
      ) as SionnaOutput;

      expect(result.transmitters[0].antenna).toEqual({
        type: 'dipole',
        height: 12,
        gain: 4,
        polarization: 'horizontal',
        orientation: { azimuth: 45, tilt: 10 },
        array: { rows: 2, columns: 4, element_spacing: 0.75 },
      });
    });
  });

  describe('receivers (cars)', () => {
    it('names each receiver vehicle_{index} and rounds its position', () => {
      const result = generateSionnaConfig(
        defaultSimConfig,
        [],
        [],
        [makeCar({ x: 1.005, y: -2, z: 0 }), makeCar({ x: 9, y: 9, z: 9 })],
      ) as SionnaOutput;

      expect(result.receivers).toEqual([
        { name: 'vehicle_0', position: [1, -2, 0] },
        { name: 'vehicle_1', position: [9, 9, 9] },
      ]);
    });
  });

  describe('buildings', () => {
    it('uses the building name when set', () => {
      const result = generateSionnaConfig(
        defaultSimConfig,
        [],
        [makeBuilding({ name: 'Warehouse A' })],
        [],
      ) as SionnaOutput;

      expect(result.buildings[0].name).toBe('Warehouse A');
    });

    it('falls back to building_{index} when the name is an empty string', () => {
      const result = generateSionnaConfig(
        defaultSimConfig,
        [],
        [makeBuilding({ name: '' })],
        [],
      ) as SionnaOutput;

      expect(result.buildings[0].name).toBe('building_0');
    });

    it('falls back to default width/depth when missing, but always passes through height and material', () => {
      const building = makeBuilding({ height: 15, material: 'glass' });
      delete (building as Partial<Building>).width;
      delete (building as Partial<Building>).depth;

      const result = generateSionnaConfig(
        defaultSimConfig,
        [],
        [building],
        [],
      ) as SionnaOutput;

      expect(result.buildings[0].width).toBe(20);
      expect(result.buildings[0].depth).toBe(20);
      expect(result.buildings[0].height).toBe(15);
      expect(result.buildings[0].material).toBe('glass');
    });

    it('uses the provided width/depth instead of the fallback when present', () => {
      const result = generateSionnaConfig(
        defaultSimConfig,
        [],
        [makeBuilding({ width: 40, depth: 30 })],
        [],
      ) as SionnaOutput;

      expect(result.buildings[0].width).toBe(40);
      expect(result.buildings[0].depth).toBe(30);
    });
  });
});
