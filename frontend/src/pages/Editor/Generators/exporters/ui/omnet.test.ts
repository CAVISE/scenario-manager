import { describe, it, expect } from 'vitest';
import { generateOmnetConfig } from './omnet';
import { defaultSimConfig } from '../../types/configGeneratorsTypes';
import type { Car, RSU } from '../../../../../store/types/useEditorStoreTypes';

const makeRSU = (overrides: Partial<RSU> = {}): RSU =>
  ({
    id: 'rsu-1',
    name: 'RSU 1',
    x: 12.34,
    y: 56.78,
    z: 3,
    tx_power: 23,
    frequency: 5.9,
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

describe('generateOmnetConfig', () => {
  it('renders sim-time-limit, connection manager, and node fields from config.omnet', () => {
    const ini = generateOmnetConfig(defaultSimConfig, [], []);

    expect(ini).toContain(`sim-time-limit = ${defaultSimConfig.sim_duration}s`);
    expect(ini).toContain(
      `*.connectionManager.maxInterfDist = ${defaultSimConfig.omnet.max_interf_dist}m`,
    );
    expect(ini).toContain(
      `*.node[*].nic.mac1609_4.txPower = ${defaultSimConfig.omnet.tx_power}dBm`,
    );
    expect(ini).toContain(
      `*.node[*].nic.mac1609_4.bitrate = ${defaultSimConfig.omnet.bitrate}Mbps`,
    );
    expect(ini).toContain(
      `*.node[*].appl.beaconInterval = ${defaultSimConfig.omnet.beaconing_interval}ms`,
    );
  });

  it('reports numVehicles and numRSU as the length of the given arrays', () => {
    const ini = generateOmnetConfig(
      defaultSimConfig,
      [makeRSU(), makeRSU()],
      [makeCar()],
    );

    expect(ini).toContain('**.numVehicles = 1');
    expect(ini).toContain('**.numRSU = 2');
  });

  it('handles an empty scenario (no RSUs, no cars)', () => {
    const ini = generateOmnetConfig(defaultSimConfig, [], []);

    expect(ini).toContain('**.numVehicles = 0');
    expect(ini).toContain('**.numRSU = 0');
    expect(ini).not.toContain('*.rsu[');
  });

  it('emits one mobility/appl block per RSU, indexed and rounded to one decimal', () => {
    const ini = generateOmnetConfig(
      defaultSimConfig,
      [
        makeRSU({ x: 1.005, y: 2.049, z: 3, tx_power: 20, range: 250 }),
        makeRSU({ x: 9, y: 8, z: 7, tx_power: 15, range: 100 }),
      ],
      [],
    );

    expect(ini).toContain('*.rsu[0].mobility.x = 1.0');
    expect(ini).toContain('*.rsu[0].mobility.y = 2.0');
    expect(ini).toContain('*.rsu[0].mobility.z = 3.0');
    expect(ini).toContain('*.rsu[0].appl.txPower = 20dBm');
    expect(ini).toContain('*.rsu[0].appl.communicationRange = 250m');

    expect(ini).toContain('*.rsu[1].mobility.x = 9.0');
    expect(ini).toContain('*.rsu[1].appl.txPower = 15dBm');
    expect(ini).toContain('*.rsu[1].appl.communicationRange = 100m');
  });

  it('sets useServiceChannel to false for the ITS-G5 protocol', () => {
    const config = {
      ...defaultSimConfig,
      omnet: { ...defaultSimConfig.omnet, protocol: 'ITS-G5' as const },
    };

    const ini = generateOmnetConfig(config, [], []);

    expect(ini).toContain('*.node[*].nic.mac1609_4.useServiceChannel = false');
  });

  it('sets useServiceChannel to true for any non-ITS-G5 protocol', () => {
    const cVehicleToVehicle = {
      ...defaultSimConfig,
      omnet: { ...defaultSimConfig.omnet, protocol: 'C-V2X' as const },
    };
    const dsrc = {
      ...defaultSimConfig,
      omnet: { ...defaultSimConfig.omnet, protocol: 'DSRC' as const },
    };

    expect(generateOmnetConfig(cVehicleToVehicle, [], [])).toContain(
      '*.node[*].nic.mac1609_4.useServiceChannel = true',
    );
    expect(generateOmnetConfig(dsrc, [], [])).toContain(
      '*.node[*].nic.mac1609_4.useServiceChannel = true',
    );
  });
});
