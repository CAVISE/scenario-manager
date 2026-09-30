import { OpenCDAAttackConfig } from '@scenario-export';
import { Button, Chip, Stack } from '@mui/material';
import type { AttackListProps } from '../types/AttackConfigModalTypes';

function getStageLabels(stages: OpenCDAAttackConfig['stages']): string {
  if (!stages || stages.length === 0) return '';

  if (stages.length === 1) {
    return stages[0].type;
  }

  return `${stages[0].type}+${stages.length - 1}`;
}

export function AttackList({
  attacks,
  selectedAttack,
  onSelect,
}: AttackListProps) {
  return (
    <Stack direction="row" gap={1} flexWrap="wrap">
      {attacks.map((attack, idx) => {
        const stageLabel = getStageLabels(attack.stages);
        const hasStages = stageLabel.length > 0;

        return (
          <Button
            key={`${attack.name}-${idx}`}
            size="small"
            variant={idx === selectedAttack ? 'contained' : 'outlined'}
            onClick={() => onSelect(idx)}
            endIcon={
              hasStages ? (
                <Chip
                  className="attack-config-modal__stage-chip"
                  label={stageLabel}
                  size="small"
                  color="success"
                />
              ) : undefined
            }
          >
            {attack.name || `attack_${idx + 1}`}
          </Button>
        );
      })}
    </Stack>
  );
}
