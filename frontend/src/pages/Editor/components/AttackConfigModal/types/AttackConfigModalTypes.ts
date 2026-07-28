import type { OpenCDAAttackConfig } from '../../../Generators/types/configGeneratorsTypes';

export interface AttackConfigModalProps {
  open: boolean;
  onClose: () => void;
}

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

export const defaultAttackConfig = (): OpenCDAAttackConfig => ({
  name: `attack_${Date.now()}`,
  requirements: {},
  start_trigger: {},
  stop_trigger: {},
  targets: {},
  stages: [],
});
