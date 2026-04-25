import { Button, ToggleButtonGroup, ToggleButton } from '@mui/material';
import {
  Stack,
  FormControl,
  FormLabel,
  Input,
  Grid,
  Divider,
  Typography,
} from '@mui/joy';
import { numInputSlot } from '../../../types/PanelTypes';
import {
  BuildingPropertiesProps,
  formLabelStyles,
  toggleButtonGroupStyles,
  toggleButtonStyles,
  typographyStyles,
} from '../types/BuildingPropertiesTypes';
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
      <Typography level="title-sm">Building</Typography>

      <FormLabel>Position</FormLabel>
      <Grid container spacing={1}>
        {(['x', 'y', 'z'] as const).map((axis) => (
          <Grid xs={4} key={axis}>
            <FormControl>
              <FormLabel sx={formLabelStyles}>{axis.toUpperCase()}</FormLabel>
              <Input
                size="sm"
                type="number"
                slotProps={numInputSlot}
                value={building[axis].toFixed(3)}
                onChange={(e) =>
                  updateBuilding(building.id, {
                    [axis]: parseFloat(e.target.value),
                  })
                }
              />
            </FormControl>
          </Grid>
        ))}
      </Grid>

      <Divider />
      <Typography level="title-sm" sx={typographyStyles}>
        Sionna / OMNeT++ Parameters
      </Typography>

      <FormControl>
        <FormLabel>Height (m)</FormLabel>
        <Input
          size="sm"
          type="number"
          slotProps={numInputSlot}
          value={building.height ?? 20}
          onChange={(e) =>
            updateBuilding(building.id, { height: parseFloat(e.target.value) })
          }
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
