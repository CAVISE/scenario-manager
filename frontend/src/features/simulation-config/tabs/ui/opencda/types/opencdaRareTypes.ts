import type {
  OpenCDAConfig,
  OpenCDAUpdate,
  RgbColor,
} from './opencdaSectionTypes';

export interface OpenCDARareSectionsProps {
  oc: OpenCDAConfig;
  update: OpenCDAUpdate;
}

export type BehaviorServicesSectionProps = OpenCDARareSectionsProps;
export type CarlaTrafficManagerSectionProps = OpenCDARareSectionsProps;
export type ExportTogglesSectionProps = OpenCDARareSectionsProps;
export type WorldClientHostFieldProps = OpenCDARareSectionsProps;

export interface GnssDebugSectionProps extends OpenCDARareSectionsProps {
  patchGnss: (patch: Partial<OpenCDAConfig['gnss_noise']>) => void;
}

export interface MapManagerSectionProps {
  mapManager: OpenCDAConfig['map_manager'];
  patch: (patch: Partial<OpenCDAConfig['map_manager']>) => void;
}

export interface SafetyManagerSectionProps {
  safetyManager: Partial<OpenCDAConfig['safety_manager']>;
  patch: (patch: Partial<OpenCDAConfig['safety_manager']>) => void;
}

export interface PlatoonBaseSectionProps {
  platoonBase: Partial<OpenCDAConfig['platoon_base']>;
  patch: (patch: Partial<OpenCDAConfig['platoon_base']>) => void;
}

export type ControllerConfig = Partial<OpenCDAConfig['controller_pid']>;

export interface ControllerPidSectionProps {
  controller: ControllerConfig;
  patch: (patch: Partial<ControllerConfig>) => void;
}

export type MetricsConfig = Partial<OpenCDAConfig['metrics']>;

export interface MetricsSectionProps {
  metrics: MetricsConfig;
  patch: (patch: Partial<MetricsConfig>) => void;
}

export type CoopPerceptionConfig = Partial<OpenCDAConfig['coop_perception']>;

export interface CoopPerceptionSectionProps {
  coopPerception: CoopPerceptionConfig;
  patch: (patch: Partial<CoopPerceptionConfig>) => void;
}

export interface NumFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
}

export interface RgbTripleProps {
  label: string;
  value: RgbColor;
  onChange: (value: RgbColor) => void;
}
