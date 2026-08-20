import { OpenCDAAttackConfig } from '@editor/Generators/types/configGeneratorsTypes';
import { nanoid } from 'nanoid';

export const GNSS_DRIFT_PARAMS = {
  mode: 'drift',
  start_time: 10,
  ramp_duration: 8,
  lateral_offset: 1.8,
  longitudinal_offset: 0.5,
  drift_rate: 0.08,
  jitter_stddev: 0.08,
  max_offset: 3,
} as const;

export const GNSS_NOISE_PARAMS = {
  mode: 'noise',
  intensity: 'medium',
} as const;

export const GNSS_NOISE_INTENSITY_PREVIEW: Record<
  string,
  {
    noise_alt_stddev: number;
    noise_lat_stddev: number;
    noise_lon_stddev: number;
  }
> = {
  low: {
    noise_alt_stddev: 1.0,
    noise_lat_stddev: 3e-5,
    noise_lon_stddev: 3e-5,
  },
  medium: {
    noise_alt_stddev: 5.0,
    noise_lat_stddev: 1e-4,
    noise_lon_stddev: 1e-4,
  },
  high: {
    noise_alt_stddev: 15.0,
    noise_lat_stddev: 5e-4,
    noise_lon_stddev: 5e-4,
  },
};

export const GNSS_STEALTH_PARAMS = {
  mode: 'stealth',
  start_time: 10,
  ramp_duration: 8,
  lateral_offset: 1.8,
  longitudinal_offset: 0.5,
  drift_rate: 0.08,
  jitter_stddev: 0,
  max_sigma: 2,
} as const;

export const GNSS_SPOOFER_PRESET: OpenCDAAttackConfig = {
  name: 'gnss_spoof',
  requirements: {},
  start_trigger: {},
  stop_trigger: {},
  targets: { cav_index: 1 },
  stages: [
    { id: nanoid(6), type: 'spoofer', params: { ...GNSS_DRIFT_PARAMS } },
  ],
};

export const attackModalSx = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 'min(94vw, 820px)',
  bgcolor: 'background.paper',
  borderRadius: 2,
  border: '1px solid',
  borderColor: 'divider',
  boxShadow: 24,
  p: 3,
  maxHeight: '90vh',
  overflowY: 'auto',
} as const;
