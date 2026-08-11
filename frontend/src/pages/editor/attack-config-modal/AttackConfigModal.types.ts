import type {
  OpenCDAAttackConfig,
  OpenCDAAttackStage,
} from '../generators/generators.types';

export interface AttackConfigModalProps {
  open: boolean;
  onClose: () => void;
}

export interface AttackListProps {
  attacks: OpenCDAAttackConfig[];
  selectedAttack: number;
  onSelect: (index: number) => void;
}

export interface AttackEditorProps {
  attack: OpenCDAAttackConfig;
  attackIndex: number;
  onUpdate: (patch: Partial<OpenCDAAttackConfig>) => void;
  onDelete: () => void;
  onUpdateStage: (index: number, stage: OpenCDAAttackStage) => void;
  onAddStage: () => void;
  onDeleteStage: (index: number) => void;
}

export interface StageEditorProps {
  stage: OpenCDAAttackStage | undefined;
  onUpdate: (stage: OpenCDAAttackStage) => void;
  onDelete: () => void;
}

export interface GnssSpooferFormProps {
  stage: OpenCDAAttackStage | undefined;
  onUpdate: (stage: OpenCDAAttackStage) => void;
}

export interface JsonFieldProps {
  label: string;
  value: unknown;
  onChange: (value: Record<string, unknown> | undefined) => void;
  minRows?: number;
}
