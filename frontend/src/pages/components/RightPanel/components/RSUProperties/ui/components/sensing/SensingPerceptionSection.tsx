import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Input,
  Switch,
  Typography,
} from '@mui/material';
import { RSU } from '../../../../../../../../store/types/useEditorStoreTypes';
import { parseNumberInputChange } from '../../../../../../../Editor/components/SimConfigModal/utils/numberInputUtils';
import { numInputSlot } from '../../../../../types/PanelTypes';
import { formLabelStyles } from '../../../../CarProperties/types/CarPropertiesTypes';

interface SensingPerceptionSectionProps {
  rsu: RSU;
  updateRSU: (id: string, props: Partial<RSU>) => void;
}

export function SensingPerceptionSection({
  rsu,
  updateRSU,
}: SensingPerceptionSectionProps) {
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
        Perception
      </Typography>
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={rsu.opencda_sensing?.perception_activate ?? false}
            onChange={(e) =>
              updateRSU(rsu.id, {
                opencda_sensing: {
                  ...rsu.opencda_sensing,
                  perception_activate: e.target.checked,
                },
              })
            }
          />
        }
        label="Activate (YOLOv5 detection)"
      />

      <FormControl>
        <FormLabel sx={formLabelStyles}>Detection range (m)</FormLabel>
        <Input
          size="small"
          type="number"
          slotProps={numInputSlot}
          value={rsu.opencda_sensing?.detection_range ?? 100}
          onChange={(e) => {
            const parsed_range = parseNumberInputChange(e.target);
            if (parsed_range === undefined || isNaN(parsed_range)) return;
            updateRSU(rsu.id, {
              opencda_sensing: {
                ...rsu.opencda_sensing,
                detection_range: parsed_range,
              },
            });
          }}
        />
      </FormControl>
    </>
  );
}
