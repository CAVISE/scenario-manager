import {
  Box,
  FormControl,
  FormLabel,
  Grid,
  Input,
  Switch,
} from '@mui/material';
import { RSU } from '../../../../../../../store/types/useEditorStoreTypes';
import { numInputSlot } from '../../../../types/PanelTypes';
import { formLabelStyles } from '../../../CarProperties/types/CarPropertiesTypes';

interface OpenCDAColorSectionProps {
  rsu: RSU;
  updateRSU: (id: string, props: Partial<RSU>) => void;
  showColor: boolean;
  setShowColor: (value: boolean) => void;
}

export function OpenCDAColorSection({
  rsu,
  updateRSU,
  showColor,
  setShowColor,
}: OpenCDAColorSectionProps) {
  const opencda_color =
    rsu.opencda_color ?? ([255, 255, 255] as [number, number, number]);

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Switch
          size="small"
          checked={showColor}
          onChange={(e) => {
            setShowColor(e.target.checked);
            updateRSU(rsu.id, {
              opencda_color: e.target.checked
                ? ([255, 255, 255] as [number, number, number])
                : undefined,
            });
          }}
        />
        <FormLabel>OpenCDA color (RGB)</FormLabel>
      </Box>
      {showColor && (
        <Box
          sx={{ pl: 1, borderLeft: '2px solid', borderColor: 'primary.main' }}
        >
          <Grid item container spacing={1}>
            {([0, 1, 2] as const).map((idx) => {
              const labels = ['R', 'G', 'B'];
              return (
                <Grid item xs={4} key={idx}>
                  <FormControl>
                    <FormLabel sx={formLabelStyles}>{labels[idx]}</FormLabel>
                    <Input
                      size="small"
                      type="number"
                      slotProps={numInputSlot}
                      value={opencda_color[idx]}
                      onChange={(e) => {
                        const val = Math.max(
                          0,
                          Math.min(255, parseInt(e.target.value) || 0),
                        );
                        const next = [...opencda_color] as [
                          number,
                          number,
                          number,
                        ];
                        next[idx] = val;
                        updateRSU(rsu.id, { opencda_color: next });
                      }}
                    />
                  </FormControl>
                </Grid>
              );
            })}
          </Grid>
          <Box
            sx={{
              mt: 1,
              width: 36,
              height: 14,
              backgroundColor: `rgb(${opencda_color[0]}, ${opencda_color[1]}, ${opencda_color[2]})`,
              border: '1px solid #ccc',
            }}
          />
        </Box>
      )}
    </>
  );
}
