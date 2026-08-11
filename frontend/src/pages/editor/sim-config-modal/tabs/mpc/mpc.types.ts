import type { SimulationConfig } from '../../../generators/generators.types';

export type MpcConfig = SimulationConfig['mpc'];

export interface MpcSectionProps {
  mpc: MpcConfig;
  update: (patch: Partial<MpcConfig>) => void;
}
