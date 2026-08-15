import { describe, it, expect } from 'vitest';
import { generateMPCConfig } from './mpc';
import { defaultSimConfig } from '../../types/configGeneratorsTypes';

describe('generateMPCConfig', () => {
  it('renders every scalar field from config.mpc using its exact key name', () => {
    const yaml = generateMPCConfig(defaultSimConfig);

    expect(yaml).toContain(`NX: ${defaultSimConfig.mpc.NX}`);
    expect(yaml).toContain(`NU: ${defaultSimConfig.mpc.NU}`);
    expect(yaml).toContain(`T: ${defaultSimConfig.mpc.T}`);
    expect(yaml).toContain(`T_aug: ${defaultSimConfig.mpc.T_aug}`);
    expect(yaml).toContain(`dist_stop: ${defaultSimConfig.mpc.dist_stop}`);
    expect(yaml).toContain(`speed_stop: ${defaultSimConfig.mpc.speed_stop}`);
    expect(yaml).toContain(`time_max: ${defaultSimConfig.mpc.time_max}`);
    expect(yaml).toContain(`iter_max: ${defaultSimConfig.mpc.iter_max}`);
    expect(yaml).toContain(
      `target_speed: ${defaultSimConfig.mpc.target_speed}`,
    );
    expect(yaml).toContain(`n_ind: ${defaultSimConfig.mpc.n_ind}`);
    expect(yaml).toContain(`dt: ${defaultSimConfig.mpc.dt}`);
    expect(yaml).toContain(`d_dist: ${defaultSimConfig.mpc.d_dist}`);
    expect(yaml).toContain(`du_res: ${defaultSimConfig.mpc.du_res}`);
    expect(yaml).toContain(`RF: ${defaultSimConfig.mpc.RF}`);
    expect(yaml).toContain(`RB: ${defaultSimConfig.mpc.RB}`);
    expect(yaml).toContain(`W: ${defaultSimConfig.mpc.W}`);
    expect(yaml).toContain(`wd_ratio: ${defaultSimConfig.mpc.wd_ratio}`);
    expect(yaml).toContain(`WB: ${defaultSimConfig.mpc.WB}`);
    expect(yaml).toContain(`TR: ${defaultSimConfig.mpc.TR}`);
    expect(yaml).toContain(`TW: ${defaultSimConfig.mpc.TW}`);
    expect(yaml).toContain(`steer_deg: ${defaultSimConfig.mpc.steer_deg}`);
    expect(yaml).toContain(
      `steer_change_deg: ${defaultSimConfig.mpc.steer_change_deg}`,
    );
    expect(yaml).toContain(
      `speed_max_kph: ${defaultSimConfig.mpc.speed_max_kph}`,
    );
    expect(yaml).toContain(
      `speed_min_kph: ${defaultSimConfig.mpc.speed_min_kph}`,
    );
    expect(yaml).toContain(
      `acceleration_max: ${defaultSimConfig.mpc.acceleration_max}`,
    );
  });

  it('joins the Qf, R, and Rd vectors as comma-space-separated bracketed lists', () => {
    const config = {
      ...defaultSimConfig,
      mpc: {
        ...defaultSimConfig.mpc,
        Qf: [1, 2, 3, 4] as [number, number, number, number],
        R: [0.5, 6] as [number, number],
        Rd: [0.25, 7] as [number, number],
      },
    };

    const yaml = generateMPCConfig(config);

    expect(yaml).toContain('Qf: [1, 2, 3, 4]');
    expect(yaml).toContain('R: [0.5, 6]');
    expect(yaml).toContain('Rd: [0.25, 7]');
  });

  it('always appends the fixed unit-conversion constants', () => {
    const yaml = generateMPCConfig(defaultSimConfig);

    expect(yaml).toContain('kph_to_mps: 3.6');
    expect(yaml).toContain('deg_to_rad: 0.0174533');
  });

  it('keeps the three section comments in order', () => {
    const yaml = generateMPCConfig(defaultSimConfig);

    const systemIdx = yaml.indexOf('# system');
    const mpcIdx = yaml.indexOf('# mpc');
    const vehicleIdx = yaml.indexOf('# vehicle');
    const constsIdx = yaml.indexOf('# consts');

    expect(systemIdx).toBeGreaterThanOrEqual(0);
    expect(mpcIdx).toBeGreaterThan(systemIdx);
    expect(vehicleIdx).toBeGreaterThan(mpcIdx);
    expect(constsIdx).toBeGreaterThan(vehicleIdx);
  });
});
