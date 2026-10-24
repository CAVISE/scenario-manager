import { Box, Divider, Typography } from '@mui/material';
import NumericInput from '@right-panel/components/NumericInput';
import type { DriftLikeFieldsProps } from '../types/AttackConfigModalTypes';

export function DriftLikeFields({ params, updateParam }: DriftLikeFieldsProps) {
  return (
    <>
      <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Start time
          </Typography>
          <NumericInput
            value={params?.start_time ?? 10}
            onValueChange={(val) => updateParam('start_time', val)}
            precision={1}
            variant="outlined"
          />
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Ramp duration
          </Typography>
          <NumericInput
            value={params?.ramp_duration ?? 8}
            onValueChange={(val) => updateParam('ramp_duration', val)}
            precision={1}
            variant="outlined"
          />
        </Box>
      </Box>

      <Divider
        className="attack-config-modal__section-divider"
        textAlign="left"
      >
        Offset parameters
      </Divider>

      <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Lateral offset
          </Typography>
          <NumericInput
            value={params?.lateral_offset ?? 1.8}
            onValueChange={(val) => updateParam('lateral_offset', val)}
            precision={2}
            variant="outlined"
          />
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Longitudinal offset
          </Typography>
          <NumericInput
            value={params?.longitudinal_offset ?? 0.5}
            onValueChange={(val) => updateParam('longitudinal_offset', val)}
            precision={2}
            variant="outlined"
          />
        </Box>
      </Box>

      <Box>
        <Typography variant="caption" color="text.secondary">
          Drift rate
        </Typography>
        <NumericInput
          value={params?.drift_rate ?? 0.08}
          onValueChange={(val) => updateParam('drift_rate', val)}
          precision={3}
          variant="outlined"
        />
      </Box>
    </>
  );
}
