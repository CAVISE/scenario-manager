import type { SimulationConfig } from '../../types/configGeneratorsTypes';

export function generateMPCConfig(config: SimulationConfig): string {
  const m = config.mpc;
  return `# system
NX: ${m.NX}
NU: ${m.NU}
T: ${m.T}
T_aug: ${m.T_aug}
dist_stop: ${m.dist_stop}
speed_stop: ${m.speed_stop}
time_max: ${m.time_max}
iter_max: ${m.iter_max}
target_speed: ${m.target_speed}
n_ind: ${m.n_ind}
dt: ${m.dt}
d_dist: ${m.d_dist}
du_res: ${m.du_res}
# mpc
Qf: [${m.Qf.join(', ')}]
R: [${m.R.join(', ')}]
Rd: [${m.Rd.join(', ')}]
# vehicle
RF: ${m.RF}
RB: ${m.RB}
W: ${m.W}
wd_ratio: ${m.wd_ratio}
WB: ${m.WB}
TR: ${m.TR}
TW: ${m.TW}
steer_deg: ${m.steer_deg}
steer_change_deg: ${m.steer_change_deg}
speed_max_kph: ${m.speed_max_kph}
speed_min_kph: ${m.speed_min_kph}
acceleration_max: ${m.acceleration_max}
# consts
kph_to_mps: 3.6
deg_to_rad: 0.0174533`;
}
