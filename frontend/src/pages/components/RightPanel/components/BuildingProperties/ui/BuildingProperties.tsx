import { Button, ToggleButtonGroup, ToggleButton } from '@mui/material';
import {
  Stack,
  FormControl,
  FormLabel,
  Input,
  Grid,
  Divider,
  Typography,
} from '@mui/material';
import { numInputSlot } from '../../../types/PanelTypes';
import { parseNumberInputChange } from '../../../../../Editor/components/SimConfigModal/utils/numberInputUtils';
import {
  formLabelStyles,
  toggleButtonGroupStyles,
  toggleButtonStyles,
  typographyStyles,
} from '../../../../../../shared/styles/panelStyles';
import { BuildingPropertiesProps } from '../types/BuildingPropertiesTypes';
import { useEditorStore } from '../../../../../../store';
import { Building } from '../../../../../../store/types/useEditorStoreTypes';

export default function BuildingProperties({
  building,
  onDelete,
}: BuildingPropertiesProps) {
  const updateBuilding = useEditorStore((s) => s.updateBuilding);

  return (
    <Stack
      spacing={2}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.stopPropagation()}
    >
      <Typography variant="subtitle1">Building</Typography>

      <FormLabel>Position</FormLabel>
      <Grid item container spacing={1}>
        {(['x', 'y', 'z'] as const).map((axis) => (
          <Grid xs={4} key={axis}>
            <FormControl>
              <FormLabel sx={formLabelStyles}>{axis.toUpperCase()}</FormLabel>
              <Input
                key={`building-${building.id}-${axis}`}
                size="small"
                type="number"
                slotProps={numInputSlot}
                value={building[axis].toFixed(3)}
                onChange={(e) => {
                  const parsed = parseNumberInputChange(e.target);
                  if (parsed === undefined) return;
                  updateBuilding(building.id, { [axis]: parsed });
                }}
              />
            </FormControl>
          </Grid>
        ))}
      </Grid>

      <Divider />
      <Typography variant="subtitle2" sx={typographyStyles}>
        Sionna / OMNeT++ Parameters
      </Typography>

      <FormControl>
        <FormLabel>Height (m)</FormLabel>
        <Input
          size="small"
          type="number"
          slotProps={numInputSlot}
          value={building.height ?? 20}
          onChange={(e) => {
            const parsed_height = parseNumberInputChange(e.target);
            if (parsed_height === undefined) return;
            updateBuilding(building.id, { height: parsed_height });
          }}
        />
      </FormControl>

      <FormControl>
        <FormLabel>Material</FormLabel>
        <ToggleButtonGroup
          exclusive
          value={building.material ?? 'concrete'}
          onChange={(_, val) => {
            if (val)
              updateBuilding(building.id, {
                material: val as Building['material'],
              });
          }}
          size="small"
          fullWidth
          sx={toggleButtonGroupStyles}
        >
          {(
            ['concrete', 'glass', 'wood', 'brick'] as Building['material'][]
          ).map((mat) => (
            <ToggleButton key={mat} value={mat} sx={toggleButtonStyles}>
              {mat}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </FormControl>

      <Button color="error" variant="outlined" onClick={onDelete}>
        Delete building
      </Button>
    </Stack>
  );
}
