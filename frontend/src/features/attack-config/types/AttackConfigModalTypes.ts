import type { OpenCDAAttackConfig, OpenCDAAttackStage } from '@scenario-export';

export interface AttackConfigModalProps {
  open: boolean;
  onClose: () => void;
}

export interface JsonFieldProps {
  label: string;
  value: unknown;
  onChange: (value: Record<string, unknown> | undefined) => void;
  minRows?: number;
}

export type GnssSpooferPreset = Omit<OpenCDAAttackConfig, 'stages'> & {
  stages: OpenCDAAttackStage[];
};

export interface AttackEditorProps {
  attack: OpenCDAAttackConfig;
  attackIndex: number;
  onUpdate: (patch: Partial<OpenCDAAttackConfig>) => void;
  onDelete: () => void;
  onUpdateStage: (index: number, stage: OpenCDAAttackStage) => void;
  onAddStage: () => void;
  onDeleteStage: (index: number) => void;
}

export interface AttackListProps {
  attacks: OpenCDAAttackConfig[];
  selectedAttack: number;
  onSelect: (index: number) => void;
}

export interface GnssParams {
  mode?: GnssMode;
  start_time?: number;
  ramp_duration?: number;
  lateral_offset?: number;
  longitudinal_offset?: number;
  drift_rate?: number;
  jitter_stddev?: number;
  max_offset?: number;
  max_sigma?: number;
  intensity?: 'low' | 'medium' | 'high';
}

export type GnssMode = 'drift' | 'noise' | 'stealth';

export interface GnssSpooferFormProps {
  stage: OpenCDAAttackStage | undefined;
  onUpdate: (stage: OpenCDAAttackStage) => void;
}

export interface DriftLikeFieldsProps {
  params: GnssParams | undefined;
  updateParam: (key: string, value: number) => void;
}

export interface StageEditorProps {
  stage: OpenCDAAttackStage | undefined;
  onUpdate: (stage: OpenCDAAttackStage) => void;
  onDelete: () => void;
}
