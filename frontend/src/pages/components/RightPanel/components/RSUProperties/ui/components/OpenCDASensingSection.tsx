import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
} from '@mui/material';
import { KeyboardArrowDown as KeyboardArrowDownIcon } from '@mui/icons-material';
import { SensingPerceptionSection } from './sensing/SensingPerceptionSection';
import { SensingCameraSection } from './sensing/SensingCameraSection';
import { SensingLidarSection } from './sensing/SensingLidarSection';
import { SensingLocalizationSection } from './sensing/SensingLocalizationSection';
import type { RSU } from '@/store/types/useEditorStoreTypes';

interface OpenCDASensingSectionProps {
  rsu: RSU;
  updateRSU: (id: string, props: Partial<RSU>) => void;
}

export function OpenCDASensingSection({
  rsu,
  updateRSU,
}: OpenCDASensingSectionProps) {
  return (
    <Accordion>
      <AccordionSummary expandIcon={<KeyboardArrowDownIcon />}>
        <Typography variant="subtitle2">OpenCDA Sensing (CARLA)</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <SensingPerceptionSection rsu={rsu} updateRSU={updateRSU} />
          <SensingCameraSection rsu={rsu} updateRSU={updateRSU} />
          <SensingLidarSection rsu={rsu} updateRSU={updateRSU} />
          <SensingLocalizationSection rsu={rsu} updateRSU={updateRSU} />
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
