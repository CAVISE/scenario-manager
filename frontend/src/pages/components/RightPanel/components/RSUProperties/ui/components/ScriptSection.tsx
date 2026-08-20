import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  FormControl,
  Typography,
} from '@mui/material';
import { KeyboardArrowDown as KeyboardArrowDownIcon } from '@mui/icons-material';
import { RSU } from '@/store/types/useEditorStoreTypes';
import { RsuPropertiesTextareaStyles } from '../../types/RSUPropertiesTypes';

interface ScriptSectionProps {
  rsu: RSU;
  updateRSU: (id: string, props: Partial<RSU>) => void;
}

export function ScriptSection({ rsu, updateRSU }: ScriptSectionProps) {
  return (
    <Accordion>
      <AccordionSummary expandIcon={<KeyboardArrowDownIcon />}>
        <Typography variant="subtitle2">Script</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <FormControl>
          <textarea
            rows={8}
            style={RsuPropertiesTextareaStyles}
            placeholder="// RSU scenario..."
            value={rsu.scenario ?? ''}
            onKeyDown={(e) => e.stopPropagation()}
            onChange={(e) => updateRSU(rsu.id, { scenario: e.target.value })}
          />
        </FormControl>
      </AccordionDetails>
    </Accordion>
  );
}
