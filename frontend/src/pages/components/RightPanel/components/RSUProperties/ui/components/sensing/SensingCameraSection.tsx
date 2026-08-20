import { FormControl, FormLabel, Grid, Input, Typography } from '@mui/material';
import { RSU } from '@/store/types/useEditorStoreTypes';
import { parseNumberInputChange } from '@editor/components/SimConfigModal/utils/numberInputUtils';
import { numInputSlot } from '@right-panel/types/PanelTypes';
import { formLabelStyles } from '@/shared/styles/panelStyles';

interface SensingCameraSectionProps {
  rsu: RSU;
  updateRSU: (id: string, props: Partial<RSU>) => void;
}

export function SensingCameraSection({
  rsu,
  updateRSU,
}: SensingCameraSectionProps) {
  return (
    <>
      <Typography variant="caption" color="text.secondary">
        Camera
      </Typography>
      <Grid item container spacing={1}>
        <Grid item xs={6}>
          <FormControl>
            <FormLabel sx={formLabelStyles}>Visualize (count)</FormLabel>
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
        <Grid item xs={6}>
          <FormControl>
            <FormLabel sx={formLabelStyles}>Count</FormLabel>
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
