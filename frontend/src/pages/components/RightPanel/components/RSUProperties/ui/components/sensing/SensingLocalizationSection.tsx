import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Input,
  Switch,
  Typography,
} from '@mui/material';
import { RSU } from '@/store/types/useEditorStoreTypes';
import { parseNumberInputChange } from '@/shared/utils/numberInputUtils';
import { formLabelStyles } from '@/shared/styles/panelStyles';
import { numInputSlot } from '@right-panel/types/PanelTypes';

interface SensingLocalizationSectionProps {
  rsu: RSU;
  updateRSU: (id: string, props: Partial<RSU>) => void;
}

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
        color="text.secondary"
        sx={{
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
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
      <Grid item container spacing={1}>
        {GNSS_NOISE_FIELDS.map(({ key, label, def }) => (
          <Grid item xs={4} key={key}>
            <FormControl>
              <FormLabel sx={formLabelStyles}>{label}</FormLabel>
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
