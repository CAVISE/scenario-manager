import {
  Stack,
  FormControl,
  FormLabel,
  Input,
  Grid,
  Typography,
  Box,
  Switch,
} from '@mui/material';
import { parseNumberInputChange } from '@/shared/utils/numberInputUtils';
import { numInputSlot } from '@/shared/utils/numberInputUtils';
import type { AIMServerEditorProps } from '../../types/RSUPropertiesTypes';
import '../../../../styles/PropertyFields.scss';

export function AIMServerEditor({ service, onChange }: AIMServerEditorProps) {
  const loc = service.control_center_location ?? { x: 0, y: 0, z: 0 };

  return (
    <Stack spacing={1} className="right-panel-property-warning-panel">
      <Typography variant="caption" className="right-panel-property-subheading">
        aim_server
      </Typography>

      <FormControl>
        <Box className="right-panel-property-inline">
          <Switch
            size="small"
            checked={service.debug ?? false}
            onChange={(e) => onChange({ debug: e.target.checked })}
          />
          <FormLabel>debug</FormLabel>
        </Box>
      </FormControl>

      <FormControl>
        <FormLabel>control_radius</FormLabel>
        <Input
          size="small"
          type="number"
          slotProps={numInputSlot}
          value={service.control_radius ?? 15}
          onChange={(e) => {
            const parsed_control_radius = parseNumberInputChange(e.target);
            if (
              parsed_control_radius === undefined ||
              isNaN(parsed_control_radius)
            )
              return;
            onChange({ control_radius: parsed_control_radius });
          }}
        />
      </FormControl>

      <FormLabel className="right-panel-property-label">
        control_center_location
      </FormLabel>
      <Grid item container spacing={1}>
        {(['x', 'y', 'z'] as const).map((axis) => (
          <Grid item xs={4} key={axis}>
            <FormControl>
              <FormLabel className="right-panel-property-label">
                {axis.toUpperCase()}
              </FormLabel>
              <Input
                size="small"
                type="number"
                slotProps={numInputSlot}
                value={loc[axis]}
                onChange={(e) => {
                  const parsed_value = parseNumberInputChange(e.target);
                  if (parsed_value === undefined || isNaN(parsed_value)) return;
                  onChange({
                    control_center_location: {
                      ...loc,
                      [axis]: parsed_value,
                    },
                  });
                }}
              />
            </FormControl>
          </Grid>
        ))}
      </Grid>

      <FormControl>
        <FormLabel>model</FormLabel>
        <Input
          size="small"
          value={service.model ?? 'MTP'}
          slotProps={numInputSlot}
          onChange={(e) => onChange({ model: e.target.value })}
        />
      </FormControl>

      <FormControl>
        <FormLabel>underling_model</FormLabel>
        <Input
          size="small"
          value={service.underling_model ?? 'GNN_mtl_gnn'}
          slotProps={numInputSlot}
          onChange={(e) => onChange({ underling_model: e.target.value })}
        />
      </FormControl>

      <FormControl>
        <FormLabel>hidden_channels</FormLabel>
        <Input
          size="small"
          type="number"
          slotProps={numInputSlot}
          value={service.hidden_channels ?? 128}
          onChange={(e) => {
            const parsed_hidden_channels = parseNumberInputChange(e.target);
            if (
              parsed_hidden_channels === undefined ||
              isNaN(parsed_hidden_channels)
            )
              return;
            onChange({ hidden_channels: parsed_hidden_channels });
          }}
        />
      </FormControl>

      <FormControl>
        <FormLabel>weight (path)</FormLabel>
        <Input
          size="small"
          value={service.weight ?? ''}
          slotProps={numInputSlot}
          onChange={(e) => onChange({ weight: e.target.value })}
        />
      </FormControl>

      <FormControl>
        <FormLabel>priority</FormLabel>
        <Input
          size="small"
          type="number"
          slotProps={numInputSlot}
          value={service.priority ?? 1}
          onChange={(e) => onChange({ priority: parseInt(e.target.value) })}
        />
      </FormControl>
    </Stack>
  );
}
