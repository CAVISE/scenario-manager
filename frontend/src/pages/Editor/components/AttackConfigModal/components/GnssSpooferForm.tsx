import {
  Box,
  Divider,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  GNSS_DRIFT_PARAMS,
  GNSS_NOISE_PARAMS,
  GNSS_NOISE_INTENSITY_PREVIEW,
  GNSS_STEALTH_PARAMS,
} from '../constants/attackConstants';

import {
  toggleButtonGroupStyles,
  toggleButtonStyles,
} from '@/shared/styles/panelStyles';
import NumericInput from '@right-panel/components/NumericInput';
import { OpenCDAAttackStage } from '@editor/Generators/types/configGeneratorsTypes';

interface GnssSpooferFormProps {
  stage: OpenCDAAttackStage | undefined;
  onUpdate: (stage: OpenCDAAttackStage) => void;
}

interface GnssParams {
  mode?: 'drift' | 'noise' | 'stealth';
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

type GnssMode = 'drift' | 'noise' | 'stealth';

function DriftLikeFields({
  params,
  updateParam,
}: {
  params: GnssParams | undefined;
  updateParam: (key: string, val: number) => void;
}) {
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

export function GnssSpooferForm({ stage, onUpdate }: GnssSpooferFormProps) {
  const params = stage?.params as GnssParams | undefined;

  if (!stage || stage.type !== 'spoofer') {
    return (
      <Typography color="text.secondary" variant="body2">
        This attack type does not have a structured form. Use JSON mode below.
      </Typography>
    );
  }

  const mode: GnssMode =
    params?.mode === 'noise' || params?.mode === 'stealth'
      ? params.mode
      : 'drift';

  const updateParam = (key: string, val: number | string) => {
    onUpdate({
      ...stage,
      params: { ...params, [key]: val },
    });
  };

  const handleModeChange = (next: GnssMode | null) => {
    if (!next || next === mode) return;
    const presets: Record<GnssMode, object> = {
      drift: GNSS_DRIFT_PARAMS,
      noise: GNSS_NOISE_PARAMS,
      stealth: GNSS_STEALTH_PARAMS,
    };
    onUpdate({
      ...stage,
      params: { ...presets[next] },
    });
  };

  const preview =
    mode === 'noise'
      ? GNSS_NOISE_INTENSITY_PREVIEW[params?.intensity ?? 'medium']
      : undefined;

  return (
    <Stack spacing={2}>
      <Box onClick={(e) => e.stopPropagation()}>
        <Typography variant="caption" color="text.secondary">
          Mode
        </Typography>
        <ToggleButtonGroup
          exclusive
          fullWidth
          size="small"
          value={mode}
          onChange={(_, next) => handleModeChange(next)}
          sx={toggleButtonGroupStyles}
        >
          <ToggleButton value="drift" sx={toggleButtonStyles}>
            Drift
          </ToggleButton>
          <ToggleButton value="stealth" sx={toggleButtonStyles}>
            Stealth
          </ToggleButton>
          <ToggleButton value="noise" sx={toggleButtonStyles}>
            Noise
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {mode === 'noise' && (
        <>
          <Typography
            variant="caption"
            color="error.main"
            sx={{ display: 'block' }}
          >
            Unlike drift/stealth, noise has no start_time/ramp — it replaces the
            GNSS sensor's base noise for the whole run, active from tick one.
            The Kalman filter's trust in GNSS (R in kalman_filter.py) is
            hardcoded for normal sensor noise and does not adapt to this — so a
            20x-300x noisier signal doesn't get smoothed out, it gets amplified
            into large tick-to-tick position jumps. This applies at "low" too,
            not just medium/high. Expect erratic steering/braking or an off-road
            auto-stop; a real crash is possible. Test on a simple, low-traffic
            scenario first.
          </Typography>
          <TextField
            select
            label="Intensity"
            size="small"
            value={params?.intensity ?? 'medium'}
            onChange={(e) => updateParam('intensity', e.target.value)}
          >
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </TextField>
          {preview && (
            <Typography variant="caption" color="text.secondary">
              alt σ {preview.noise_alt_stddev} m · lat σ{' '}
              {preview.noise_lat_stddev} · lon σ {preview.noise_lon_stddev}
            </Typography>
          )}
        </>
      )}

      {mode === 'drift' && (
        <>
          <DriftLikeFields params={params} updateParam={updateParam} />
          <Divider textAlign="left" sx={{ fontSize: 12 }}>
            Noise parameters
          </Divider>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
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
                Max offset (m)
              </Typography>
              <NumericInput
                value={params?.max_offset ?? 3}
                onValueChange={(val) => updateParam('max_offset', val)}
                precision={1}
                variant="outlined"
              />
            </Box>
          </Box>
        </>
      )}

      {mode === 'stealth' && (
        <>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block' }}
          >
            Caps the induced offset at max_sigma × the target's own GNSS sensor
            stddev, instead of a flat meters value — so the bias stays within
            what a genuinely noisy (not attacked) receiver could plausibly
            produce, rather than an arbitrary distance that might be trivially
            detectable or too small to matter. Set jitter_stddev to 0 (default)
            if the sigma cap needs to actually hold — jitter is added after the
            cap and can push the real offset past it.
          </Typography>
          <DriftLikeFields params={params} updateParam={updateParam} />
          <Divider textAlign="left" sx={{ fontSize: 12 }}>
            Stealth cap
          </Divider>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Jitter stddev
              </Typography>
              <NumericInput
                value={params?.jitter_stddev ?? 0}
                onValueChange={(val) => updateParam('jitter_stddev', val)}
                precision={3}
                variant="outlined"
              />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Max sigma
              </Typography>
              <NumericInput
                value={params?.max_sigma ?? 2}
                onValueChange={(val) => updateParam('max_sigma', val)}
                precision={1}
                variant="outlined"
              />
            </Box>
          </Box>
        </>
      )}
    </Stack>
  );
}
