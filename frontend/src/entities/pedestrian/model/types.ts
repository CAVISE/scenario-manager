export type Pedestrian = {
  id: string;
  x: number;
  y: number;
  z: number;
  speed: number;
  cross_factor: number;
  is_invincible: boolean;
  tx_power: number;
  frequency: number;
  protocol: 'DSRC' | 'C-V2X';
  beacon_interval: number;
};

export type CreatePedestrianParams = Pick<Pedestrian, 'id' | 'x' | 'y' | 'z'>;
