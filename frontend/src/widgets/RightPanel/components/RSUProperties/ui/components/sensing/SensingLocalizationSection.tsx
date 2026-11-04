import '../../../../../styles/PropertyFields.scss';
import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Input,
  Switch,
  Typography,
} from '@mui/material';
import type { RSU } from '@/entities/roadside-unit';
import { parseNumberInputChange } from '@/shared/utils/numberInputUtils';
import { numInputSlot } from '@/shared/utils/numberInputUtils';
import type { SensingLocalizationSectionProps } from '../../../types/RSUPropertiesTypes';

const GNSS_NOISE_FIELDS = [
  {
    key: 'gnss_noise_alt_stddev',
    label: 'Alt stddev',
    def: 0.05,
  },
  {
    key: 'gnss_noise_lat_stddev',
    label: 'Lat stddev',
    def: 3e-6,
  },
  {
    key: 'gnss_noise_lon_stddev',
    label: 'Lon stddev',
    def: 3e-6,
  },
] as {
  key: keyof NonNullable<RSU['opencda_sensing']>;
  label: string;
  def: number;
}[];

export function SensingLocalizationSection({
  rsu,
  updateRSU,
}: SensingLocalizationSectionProps) {
  return (
    <>
      <Typography
        variant="caption"
        className="right-panel-property-eyebrow"
        sx={{
          color: 'text.secondary',
        }}
      >
        Localization
      </Typography>
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={rsu.opencda_sensing?.localization_activate ?? true}
            onChange={(e) =>
              updateRSU(rsu.id, {
                opencda_sensing: {
                  ...rsu.opencda_sensing,
                  localization_activate: e.target.checked,
                },
              })
            }
          />
        }
        label="Activate (GNSS + Kalman Filter)"
      />
      <Grid container spacing={1}>
        {GNSS_NOISE_FIELDS.map(({ key, label, def }) => (
          <Grid key={key} size={4}>
            <FormControl>
              <FormLabel className="right-panel-property-label">
                {label}
              </FormLabel>
              <Input
                size="small"
                type="number"
                slotProps={numInputSlot}
                value={rsu.opencda_sensing?.[key] ?? def}
                onChange={(e) => {
                  const parsed_value = parseNumberInputChange(e.target);
                  if (parsed_value === undefined || isNaN(parsed_value)) return;
                  updateRSU(rsu.id, {
                    opencda_sensing: {
                      ...rsu.opencda_sensing,
                      [key]: parsed_value,
                    },
                  });
                }}
              />
            </FormControl>
          </Grid>
        ))}
      </Grid>
    </>
  );
}
