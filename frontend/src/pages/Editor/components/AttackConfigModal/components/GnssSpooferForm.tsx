import { Box, Divider, Stack, TextField, Typography } from '@mui/material';
import { GNSS_DRIFT_PARAMS } from '../constants/attackConstants';
import type { OpenCDAAttackStage } from '../../../Generators/types/configGeneratorsTypes';
import NumericInput from '../../../../components/RightPanel/components/NumericInput';

interface GnssSpooferFormProps {
  stage: OpenCDAAttackStage | undefined;
  onUpdate: (stage: OpenCDAAttackStage) => void;
}

export function GnssSpooferForm({ stage, onUpdate }: GnssSpooferFormProps) {
  const params = stage?.params as typeof GNSS_DRIFT_PARAMS | undefined;

  if (!stage || stage.type !== 'spoofer') {
    return (
      <Typography color="text.secondary" variant="body2">
        This attack type does not have a structured form. Use JSON mode below.
      </Typography>
    );
  }

  const updateParam = (key: keyof typeof GNSS_DRIFT_PARAMS, val: number) => {
    onUpdate({
      ...stage,
      params: { ...params, [key]: val },
    });
  };

  return (
    <Stack spacing={2}>
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

      <Divider textAlign="left" sx={{ fontSize: 12 }}>
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

      <Divider textAlign="left" sx={{ fontSize: 12 }}>
        Noise parameters
      </Divider>

      <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={2}>
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
        <Box>
          <Typography variant="caption" color="text.secondary">
            Jitter stddev
          </Typography>
          <NumericInput
            value={params?.jitter_stddev ?? 0.08}
            onValueChange={(val) => updateParam('jitter_stddev', val)}
            precision={3}
            variant="outlined"
          />
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Max offset
          </Typography>
          <NumericInput
            value={params?.max_offset ?? 3}
            onValueChange={(val) => updateParam('max_offset', val)}
            precision={1}
            variant="outlined"
          />
        </Box>
      </Box>

      <TextField
        label="Mode"
        size="small"
        value={params?.mode ?? 'drift'}
        onChange={(e) =>
          onUpdate({
            ...stage,
            params: { ...params, mode: e.target.value },
          })
        }
        helperText="Usually 'drift' for GNSS spoofing"
      />
    </Stack>
  );
}
