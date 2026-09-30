import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  FormControl,
  Typography,
} from '@mui/material';
import { KeyboardArrowDown as KeyboardArrowDownIcon } from '@mui/icons-material';
import type { ScriptSectionProps } from '../../types/RSUPropertiesTypes';
import '../../../../styles/PropertyFields.scss';

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
            className="right-panel-property-script"
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
