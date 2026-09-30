import {
  Box,
  FormControl,
  FormLabel,
  Grid,
  Input,
  Switch,
} from '@mui/material';
import { numInputSlot } from '@/shared/utils/numberInputUtils';
import type { OpenCDAColorSectionProps } from '../../types/RSUPropertiesTypes';
import '../../../../styles/PropertyFields.scss';

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
      <Box className="right-panel-property-inline">
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
        <Box className="right-panel-property-primary-panel">
          <Grid item container spacing={1}>
            {([0, 1, 2] as const).map((idx) => {
              const labels = ['R', 'G', 'B'];
              return (
                <Grid item xs={4} key={idx}>
                  <FormControl>
                    <FormLabel className="right-panel-property-label">
                      {labels[idx]}
                    </FormLabel>
                    <Input
                      size="small"
                      type="number"
                      slotProps={numInputSlot}
                      value={opencda_color[idx]}
                      onChange={(e) => {
                        const val = Math.max(
                          0,
                          Math.min(255, parseInt(e.target.value) || 0)
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
          <input
            type="color"
            className="right-panel-property-color-preview"
            value={`#${opencda_color
              .map((value) => value.toString(16).padStart(2, '0'))
              .join('')}`}
            readOnly
            tabIndex={-1}
            aria-label="Current RSU color"
          />
        </Box>
      )}
    </>
  );
}
