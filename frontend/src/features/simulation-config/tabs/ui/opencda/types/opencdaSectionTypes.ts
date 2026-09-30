import type { SimulationConfig } from '@/store';

export type OpenCDAConfig = SimulationConfig['opencda'];
export type OpenCDAUpdate = (update: Partial<OpenCDAConfig>) => void;
export type RgbColor = [number, number, number];

interface OpenCDASectionProps {
  onUpdate: OpenCDAUpdate;
}

export interface LidarDropoffSectionProps extends OpenCDASectionProps {
  dropoffGeneralRate: number;
  dropoffIntensityLimit: number;
  dropoffZeroIntensity: number;
  noiseStddev: number;
}

export interface BackgroundTrafficSectionProps extends OpenCDASectionProps {
  enabled: boolean;
  random: boolean;
  spawnRange: {
    x_min: number;
    x_max: number;
    y_min: number;
    y_max: number;
    x_step: number;
    y_step: number;
  };
  globalSpeedPerc: number;
  vehicleNum: number;
  globalDistance: number;
  osmMode: boolean;
  ignoreLightsPerc: number;
  ignoreSignsPerc: number;
  ignoreWalkersPerc: number;
  autoLaneChange: boolean;
}

export interface GnssNoiseSectionProps extends OpenCDASectionProps {
  altStddev: number;
  latStddev: number;
  lonStddev: number;
  debugAnimation: boolean;
}

export interface BlueprintSectionProps extends OpenCDASectionProps {
  useMultiClass: boolean;
  bpMetaPath: string;
  classProbabilities: {
    car: number;
    truck: number;
    bus: number;
    bicycle: number;
    motorcycle: number;
  };
}

export interface VehicleSensingSectionProps extends OpenCDASectionProps {
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
}

export interface SumoConnectionSectionProps extends OpenCDASectionProps {
  host: string;
  port: number;
  clientOrder: number;
  gui: boolean;
}

export interface LocalPlannerSectionProps extends OpenCDASectionProps {
  bufferSize: number;
  trajectoryUpdateFreq: number;
  waypointUpdateFreq: number;
  minDist: number;
  trajectoryDt: number;
  debug: boolean;
  debugTrajectory: boolean;
}

export interface VehicleBehaviorSectionProps extends OpenCDASectionProps {
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
  staticObstacleAvoidanceEnabled: boolean;
}

export interface ColorPickerSectionProps {
  color: RgbColor;
  hasColor: boolean;
  onColorToggle: (enabled: boolean) => void;
  onColorChange: (newColor: RgbColor) => void;
}

export interface V2XSectionProps extends OpenCDASectionProps {
  enabled: boolean;
  range: number;
  positionSource: 'estimated' | 'ground_truth';
}

export type ExportProfile = 'standard' | 'aim_check';

export interface ExportProfileSectionProps {
  exportProfile: ExportProfile;
  onExportProfileChange: (value: ExportProfile) => void;
  onLoadAimDefaults: () => void;
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
