import { Button } from '@mui/material';
import {
  Stack,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { KeyboardArrowDown as KeyboardArrowDownIcon } from '@mui/icons-material';
import { useEditorStore } from '@/store';
import LidarProperties from '../../LidarProperties';
import { CarLidarListProps } from '../types/CarLidarListTypes';

export default function CarLidarList({ carId, lidars }: CarLidarListProps) {
  const addLidar = useEditorStore((s) => s.addLidar);
  const removeLidar = useEditorStore((s) => s.removeLidar);
  return (
    <Stack spacing={1}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Lidars ({lidars.length})</Typography>
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
          <AccordionSummary expandIcon={<KeyboardArrowDownIcon />}>
            <Typography variant="subtitle1">Lidar {i + 1}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <LidarProperties
              lidar={l}
              onDelete={() => {
                removeLidar(l.id);
              }}
            />
          </AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  );
}
