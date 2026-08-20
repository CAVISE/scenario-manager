import { describe, it, expect } from 'vitest';
import { generateArteryConfig } from './artery';
import { defaultSimConfig } from '../../types/configGeneratorsTypes';
import { RSU } from '@/store/types/useEditorStoreTypes';

const makeRSU = (overrides: Partial<RSU> = {}): RSU =>
  ({
    id: 'rsu-1',
    name: 'RSU 1',
    x: 1.05,
    y: 2.09,
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

describe('generateArteryConfig', () => {
  it('renders sim-time-limit and traci/middleware fields from config.artery', () => {
    const ini = generateArteryConfig(defaultSimConfig, []);

    expect(ini).toContain(`sim-time-limit = ${defaultSimConfig.sim_duration}s`);
    expect(ini).toContain(
      `*.traci.launcher.sumocfg = "${defaultSimConfig.artery.sumo_config}"`
    );
    expect(ini).toContain(
      `*.traci.launcher.stepLength = ${defaultSimConfig.artery.sumo_step_length}s`
    );
    expect(ini).toContain(
      `*.traci.launcher.seed = ${defaultSimConfig.artery.sumo_seed}`
    );
    expect(ini).toContain(
      `*.node[*].vanetza[0].cam.minInterval = ${defaultSimConfig.artery.cam_interval_min}ms`
    );
    expect(ini).toContain(
      `*.node[*].vanetza[0].cam.maxInterval = ${defaultSimConfig.artery.cam_interval_max}ms`
    );
  });

  it('reports numRSU as the RSU array length and omits RSU lines when empty', () => {
    const ini = generateArteryConfig(defaultSimConfig, []);

    expect(ini).toContain('**.numRSU = 0');
    expect(ini).not.toContain('*.rsu[');
  });

  describe('vehicle service flags (CaService is always present, DenM/CP are conditional)', () => {
    it('includes only CaService when denm and cp_service are both disabled', () => {
      const config = {
        ...defaultSimConfig,
        artery: {
          ...defaultSimConfig.artery,
          denm_enabled: false,
          cp_service_enabled: false,
        },
      };

      const ini = generateArteryConfig(config, []);

      expect(ini).toContain('artery.application.CaService');
      expect(ini).not.toContain('artery.application.DenmService');
      expect(ini).not.toContain('artery.cp.CpService');
    });

    it('includes DenmService when denm_enabled is true', () => {
      const config = {
        ...defaultSimConfig,
        artery: {
          ...defaultSimConfig.artery,
          denm_enabled: true,
          cp_service_enabled: false,
        },
      };

      const ini = generateArteryConfig(config, []);

      expect(ini).toContain('artery.application.DenmService');
      expect(ini).not.toContain('artery.cp.CpService');
    });

    it('includes CpService when cp_service_enabled is true', () => {
      const config = {
        ...defaultSimConfig,
        artery: {
          ...defaultSimConfig.artery,
          denm_enabled: false,
          cp_service_enabled: true,
        },
      };

      const ini = generateArteryConfig(config, []);

      expect(ini).not.toContain('artery.application.DenmService');
      expect(ini).toContain('artery.cp.CpService');
    });

    it('includes all three services when both flags are enabled', () => {
      const config = {
        ...defaultSimConfig,
        artery: {
          ...defaultSimConfig.artery,
          denm_enabled: true,
          cp_service_enabled: true,
        },
      };

      const ini = generateArteryConfig(config, []);

      expect(ini).toContain('artery.application.CaService');
      expect(ini).toContain('artery.application.DenmService');
      expect(ini).toContain('artery.cp.CpService');
    });
  });

  describe('RSU service flags (independent of the vehicle service flags)', () => {
    it('emits neither RSU service when both rsu flags are disabled', () => {
      const config = {
        ...defaultSimConfig,
        artery: {
          ...defaultSimConfig.artery,
          rsu_cam_enabled: false,
          rsu_denm_enabled: false,
        },
      };

      const ini = generateArteryConfig(config, [makeRSU()]);
      const rsuServicesBlock = ini.split('**.numRSU')[1] ?? '';

      expect(rsuServicesBlock).not.toContain('artery.application.CaService');
      expect(rsuServicesBlock).not.toContain('artery.application.DenmService');
    });

    it('emits both RSU services when both rsu flags are enabled', () => {
      const config = {
        ...defaultSimConfig,
        artery: {
          ...defaultSimConfig.artery,
          rsu_cam_enabled: true,
          rsu_denm_enabled: true,
        },
      };

      const ini = generateArteryConfig(config, [makeRSU()]);
      const rsuServicesBlock = ini.split('**.numRSU')[1] ?? '';

      expect(rsuServicesBlock).toContain('artery.application.CaService');
      expect(rsuServicesBlock).toContain('artery.application.DenmService');
    });
  });

  describe('per-RSU line generation', () => {
    it('formats mobility coordinates rounded to one decimal, indexed by array position', () => {
      const ini = generateArteryConfig(defaultSimConfig, [
        makeRSU({ x: 1.049, y: 2.051, z: 9 }),
        makeRSU({ x: 5, y: 6, z: 7 }),
      ]);

      expect(ini).toContain('*.rsu[0].mobility.x = 1.0');
      expect(ini).toContain('*.rsu[0].mobility.y = 2.1');
      expect(ini).toContain('*.rsu[0].mobility.z = 9.0');
      expect(ini).toContain('*.rsu[1].mobility.x = 5.0');
      expect(ini).toContain('**.numRSU = 2');
    });

    it('uses the RSU protocol, tx_power, frequency, and range as-is', () => {
      const ini = generateArteryConfig(defaultSimConfig, [
        makeRSU({
          protocol: 'C-V2X',
          tx_power: 30,
          frequency: 5.9e9,
          range: 500,
        }),
      ]);

      expect(ini).toContain('*.rsu[0].vanetza[0].access.protocol = "C-V2X"');
      expect(ini).toContain('*.rsu[0].wlan[0].radio.transmitter.power = 30dBm');
      expect(ini).toContain(
        '*.rsu[0].wlan[0].radio.centerFrequency = 5900000000Hz'
      );
      expect(ini).toContain('*.rsu[0].appl.communicationRange = 500m');
    });

    it('falls back to sane defaults when optional antenna/network fields are missing', () => {
      const rsu = makeRSU();

      delete (rsu as Partial<RSU>).network_protocol;
      delete (rsu as Partial<RSU>).antenna_type;
      delete (rsu as Partial<RSU>).antenna_height;
      delete (rsu as Partial<RSU>).antenna_gain;
      delete (rsu as Partial<RSU>).azimuth;
      delete (rsu as Partial<RSU>).tilt;
      delete (rsu as Partial<RSU>).cam_interval;

      const ini = generateArteryConfig(defaultSimConfig, [rsu]);

      expect(ini).toContain(
        '*.rsu[0].vanetza[0].network.protocol = "GeoNetworking"'
      );
      expect(ini).toContain('*.rsu[0].antenna.type = "isotropic"');
      expect(ini).toContain('*.rsu[0].antenna.height = 5m');
      expect(ini).toContain('*.rsu[0].antenna.gain = 0dBi');
      expect(ini).toContain('*.rsu[0].antenna.azimuth = 0');
      expect(ini).toContain('*.rsu[0].antenna.tilt = 0');
      expect(ini).toContain('*.rsu[0].appl.camInterval = 100ms');
    });

    it('uses the provided antenna/network fields when present instead of the fallback', () => {
      const ini = generateArteryConfig(defaultSimConfig, [
        makeRSU({
          network_protocol: 'BTP',
          antenna_type: 'dipole',
          antenna_height: 12,
          antenna_gain: 3,
          azimuth: 90,
          tilt: 15,
          cam_interval: 250,
        }),
      ]);

      expect(ini).toContain('*.rsu[0].vanetza[0].network.protocol = "BTP"');
      expect(ini).toContain('*.rsu[0].antenna.type = "dipole"');
      expect(ini).toContain('*.rsu[0].antenna.height = 12m');
      expect(ini).toContain('*.rsu[0].antenna.gain = 3dBi');
      expect(ini).toContain('*.rsu[0].antenna.azimuth = 90');
      expect(ini).toContain('*.rsu[0].antenna.tilt = 15');
      expect(ini).toContain('*.rsu[0].appl.camInterval = 250ms');
    });
  });
});
