import type { ReactNode } from 'react';
import type { SimulationConfig } from '../../../generators/generators.types';

export type CapiConfig = SimulationConfig['capi'];

export interface CapiSectionProps {
  capi: CapiConfig;
  update: (patch: Partial<CapiConfig>) => void;
}

export interface CapiServiceBoxProps {
  enabled: boolean;
  port: number;
  onEnabledChange: (checked: boolean) => void;
  onPortChange: (value: number) => void;
  children?: ReactNode;
  label: string;
}
