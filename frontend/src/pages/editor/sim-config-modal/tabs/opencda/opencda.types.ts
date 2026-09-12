import type { SimulationConfig } from '../../../generators/generators.types';

export type OpenCDAConfig = SimulationConfig['opencda'];
export type OpenCDAUpdate = (update: Partial<OpenCDAConfig>) => void;

export interface OpenCDAAdvancedSectionsProps {
  oc: OpenCDAConfig;
  update: OpenCDAUpdate;
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
  value: [number, number, number];
  onChange: (value: [number, number, number]) => void;
}

export interface BackgroundTrafficSectionProps {
  enabled: boolean;
  random: boolean;
  spawnRange: OpenCDAConfig['bg_spawn_range'];
  globalSpeedPerc: number;
  vehicleNum: number;
  globalDistance: number;
  osmMode: boolean;
  ignoreLightsPerc: number;
  ignoreSignsPerc: number;
  ignoreWalkersPerc: number;
  autoLaneChange: boolean;
  onUpdate: OpenCDAUpdate;
}

export interface BlueprintSectionProps {
  useMultiClass: boolean;
  bpMetaPath: string;
  classProbabilities: OpenCDAConfig['bp_class_sample_prob'];
  onUpdate: OpenCDAUpdate;
}

export interface ColorPickerSectionProps {
  color: [number, number, number];
  hasColor: boolean;
  onColorToggle: (enabled: boolean) => void;
  onColorChange: (newColor: [number, number, number]) => void;
}

export interface ExportProfileSectionProps {
  exportProfile: 'standard' | 'aim_check';
  onExportProfileChange: (value: 'standard' | 'aim_check') => void;
  onLoadAimDefaults: () => void;
}

export interface GnssNoiseSectionProps {
  altStddev: number;
  latStddev: number;
  lonStddev: number;
  debugAnimation: boolean;
  onUpdate: OpenCDAUpdate;
}

export interface LidarDropoffSectionProps {
  dropoffGeneralRate: number;
  dropoffIntensityLimit: number;
  dropoffZeroIntensity: number;
  noiseStddev: number;
  onUpdate: OpenCDAUpdate;
}

export interface LocalPlannerSectionProps {
  bufferSize: number;
  trajectoryUpdateFreq: number;
  waypointUpdateFreq: number;
  minDist: number;
  trajectoryDt: number;
  debug: boolean;
  debugTrajectory: boolean;
  onUpdate: OpenCDAUpdate;
}

export type RsuFields = Pick<
  OpenCDAConfig,
  | 'rsu_lidar_channels'
  | 'rsu_lidar_range'
  | 'rsu_camera_visualize'
  | 'rsu_cam_num'
  | 'rsu_perception_activate'
>;

export interface RsuSectionProps extends RsuFields {
  onUpdate: (update: Partial<RsuFields>) => void;
}

export interface SumoSectionProps {
  host: string;
  port: number;
  clientOrder: number;
  gui: boolean;
  onUpdate: OpenCDAUpdate;
}

export interface V2xSectionProps {
  enabled: boolean;
  range: number;
  positionSource: 'estimated' | 'ground_truth';
  onUpdate: OpenCDAUpdate;
}

export interface VehicleBehaviorSectionProps {
  maxSpeed: number;
  tailgateSpeed: number;
  safetyTime: number;
  emergencyParam: number;
  collisionTimeAhead: number;
  sampleResolution: number;
  speedLimDist: number;
  speedDecrease: number;
  overtakeCounterRecover: number;
  ignoreTrafficLight: boolean;
  overtakeAllowed: boolean;
  onUpdate: OpenCDAUpdate;
}

export interface VehicleSensingSectionProps {
  cameraVisualize: number;
  camNum: number;
  lidarChannels: number;
  lidarRange: number;
  lidarPointsPerSecond: number;
  lidarRotationFrequency: number;
  lidarUpperFov: number;
  lidarLowerFov: number;
  perceptionActivate: boolean;
  localizationActivate: boolean;
  localizationSource: 'estimated' | 'ground_truth';
  lidarVisualize: boolean;
  onUpdate: OpenCDAUpdate;
}

export interface OpenCDASectionProps {
  oc: OpenCDAConfig;
  update: OpenCDAUpdate;
}

export interface GnssDebugSectionProps extends OpenCDASectionProps {
  patchGnss: (patch: Partial<OpenCDAConfig['gnss_noise']>) => void;
}

export interface MapManagerSectionProps {
  mapManager: OpenCDAConfig['map_manager'];
  patch: (patch: Partial<OpenCDAConfig['map_manager']>) => void;
}

export interface ControllerPidSectionProps {
  controller: Partial<OpenCDAConfig['controller_pid']>;
  patch: (patch: Partial<OpenCDAConfig['controller_pid']>) => void;
}

export interface CoopPerceptionSectionProps {
  coopPerception: Partial<OpenCDAConfig['coop_perception']>;
  patch: (patch: Partial<OpenCDAConfig['coop_perception']>) => void;
}

export interface MetricsSectionProps {
  metrics: Partial<OpenCDAConfig['metrics']>;
  patch: (patch: Partial<OpenCDAConfig['metrics']>) => void;
}

export interface PlatoonBaseSectionProps {
  platoonBase: Partial<OpenCDAConfig['platoon_base']>;
  patch: (patch: Partial<OpenCDAConfig['platoon_base']>) => void;
}

export interface SafetyManagerSectionProps {
  safetyManager: Partial<OpenCDAConfig['safety_manager']>;
  patch: (patch: Partial<OpenCDAConfig['safety_manager']>) => void;
}
