import type { ReactNode } from 'react';
import type { SimulationConfig } from '@/store';

export type CapiConfig = SimulationConfig['capi'];

export interface CapiSectionProps {
  capi: CapiConfig;
  update: (patch: Partial<CapiConfig>) => void;
}

export interface ServiceBoxProps {
  enabled: boolean;
  port: number;
  onEnabledChange: (checked: boolean) => void;
  onPortChange: (value: number) => void;
  children?: ReactNode;
  label: string;
}
