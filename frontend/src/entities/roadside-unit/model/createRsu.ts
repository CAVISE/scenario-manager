import type { CreateRsuParams, RSU } from './types';

export function createRsu(params: CreateRsuParams): RSU {
  return {
    ...params,
    tx_power: 23,
    frequency: 5.9e9,
    range: 500,
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
    beacon_interval: 1000,
    scenario: '',
  };
}
