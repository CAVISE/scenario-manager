import type { SimulationConfig } from '@/store';

export type MpcConfig = SimulationConfig['mpc'];

export interface MpcSectionProps {
  mpc: MpcConfig;
  update: (patch: Partial<MpcConfig>) => void;
}
