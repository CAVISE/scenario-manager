import type {
  OpenCDAAttackConfig,
  OpenCDAAttackStage,
} from '../generators/generators.types';

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

export const GNSS_SPOOFER_PRESET: Omit<OpenCDAAttackConfig, 'stages'> & {
  stages: Omit<OpenCDAAttackStage, 'id'>[];
} = {
  name: 'gnss_spoof',
  requirements: {},
  start_trigger: {},
  stop_trigger: {},
  targets: { cav_index: 1 },
  stages: [{ type: 'spoofer', params: GNSS_DRIFT_PARAMS }],
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
