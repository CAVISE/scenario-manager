import { Button } from '@mui/material';
import {
  Stack,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/joy';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { CarListProps } from '../types/CarListTypes';
import LidarProperties from '../../LidarProperties';
import { useEditorStore } from '../../../../../../store';
import { useHooks } from '../../../../../Editor/context';
export default function CarLidarList({ carId, lidars }: CarListProps) {
  const addLidar = useEditorStore((s) => s.addLidar);
  const removeLidar = useEditorStore((s) => s.removeLidar);
  const { detachTransformControls } = useHooks();
  const handleRemoveLidar = (id: string) => {
    removeLidar(id);
    detachTransformControls();
  };
  return (
    <Stack spacing={1}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography level="title-sm">Lidars ({lidars.length})</Typography>
        <Button
          size="small"
          variant="outlined"
          onClick={() => addLidar(carId, 0, 0, 1.5)}
        >
          + Add lidar
        </Button>
      </Stack>

      {lidars.map((l, i) => (
        <Accordion key={l.id}>
          <AccordionSummary indicator={<KeyboardArrowDownIcon />}>
            <Typography level="title-sm">Lidar {i + 1}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <LidarProperties
              lidar={l}
              onDelete={() => {
                handleRemoveLidar(l.id);
              }}
            />
          </AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  );
}
