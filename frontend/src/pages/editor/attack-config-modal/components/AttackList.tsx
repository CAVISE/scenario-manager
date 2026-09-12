import { Button, Chip, Stack } from '@mui/material';
import type { OpenCDAAttackConfig } from '../../generators/generators.types';
import type { AttackListProps } from '../AttackConfigModal.types';

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
                  label={stageLabel}
                  size="small"
                  color="success"
                  sx={{ height: 16, fontSize: 10 }}
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
