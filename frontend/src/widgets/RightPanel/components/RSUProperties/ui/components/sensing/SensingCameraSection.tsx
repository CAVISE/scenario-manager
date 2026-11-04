import '../../../../../styles/PropertyFields.scss';
import { FormControl, FormLabel, Grid, Input, Typography } from '@mui/material';
import { parseNumberInputChange } from '@/shared/utils/numberInputUtils';
import { numInputSlot } from '@/shared/utils/numberInputUtils';
import type { SensingCameraSectionProps } from '../../../types/RSUPropertiesTypes';

export function SensingCameraSection({
  rsu,
  updateRSU,
}: SensingCameraSectionProps) {
  return (
    <>
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
        }}
      >
        Camera
      </Typography>
      <Grid container spacing={1}>
        <Grid size={6}>
          <FormControl>
            <FormLabel className="right-panel-property-label">
              Visualize (count)
            </FormLabel>
            <Input
              size="small"
              type="number"
              slotProps={numInputSlot}
              value={rsu.opencda_sensing?.camera_visualize ?? 4}
              onChange={(e) => {
                const parsed_visualize = parseNumberInputChange(e.target);
                if (parsed_visualize === undefined || isNaN(parsed_visualize))
                  return;
                updateRSU(rsu.id, {
                  opencda_sensing: {
                    ...rsu.opencda_sensing,
                    camera_visualize: parsed_visualize,
                  },
                });
              }}
            />
          </FormControl>
        </Grid>
        <Grid size={6}>
          <FormControl>
            <FormLabel className="right-panel-property-label">Count</FormLabel>
            <Input
              size="small"
              type="number"
              slotProps={numInputSlot}
              value={rsu.opencda_sensing?.camera_num ?? 4}
              onChange={(e) => {
                const parsed_num = parseNumberInputChange(e.target);
                if (parsed_num === undefined || isNaN(parsed_num)) return;
                updateRSU(rsu.id, {
                  opencda_sensing: {
                    ...rsu.opencda_sensing,
                    camera_num: parsed_num,
                  },
                });
              }}
            />
          </FormControl>
        </Grid>
      </Grid>
    </>
  );
}
