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
import { numInputSlot } from '@right-panel/types/PanelTypes';
import { formLabelStyles } from '@/shared/styles/panelStyles';

interface SensingLidarSectionProps {
  rsu: RSU;
  updateRSU: (id: string, props: Partial<RSU>) => void;
}

const LIDAR_FIELDS = [
  { key: 'lidar_channels', label: 'Channels', def: 32 },
  { key: 'lidar_range', label: 'Range (m)', def: 120 },
  { key: 'lidar_upper_fov', label: 'Upper FOV°', def: 2 },
  { key: 'lidar_lower_fov', label: 'Lower FOV°', def: -25 },
  {
    key: 'lidar_rotation_frequency',
    label: 'Rot. Freq.',
    def: 20,
  },
  {
    key: 'lidar_points_per_second',
    label: 'Pts/sec',
    def: 1000000,
  },
  {
    key: 'lidar_dropoff_general_rate',
    label: 'Dropoff rate',
    def: 0.3,
  },
  {
    key: 'lidar_dropoff_intensity_limit',
    label: 'Dropoff int.',
    def: 0.7,
  },
  {
    key: 'lidar_dropoff_zero_intensity',
    label: 'Dropoff zero',
    def: 0.4,
  },
  {
    key: 'lidar_noise_stddev',
    label: 'Noise stddev',
    def: 0.02,
  },
] as {
  key: keyof NonNullable<RSU['opencda_sensing']>;
  label: string;
  def: number;
}[];

export function SensingLidarSection({
  rsu,
  updateRSU,
}: SensingLidarSectionProps) {
  return (
    <>
      <Typography variant="caption" color="text.secondary">
        Lidar
      </Typography>
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={rsu.opencda_sensing?.lidar_visualize ?? true}
            onChange={(e) =>
              updateRSU(rsu.id, {
                opencda_sensing: {
                  ...rsu.opencda_sensing,
                  lidar_visualize: e.target.checked,
                },
              })
            }
          />
        }
        label="Visualize lidar points"
      />
      <Grid item container spacing={1}>
        {LIDAR_FIELDS.map(({ key, label, def }) => (
          <Grid item xs={6} key={key}>
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
