import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from '@mui/material';
import { KeyboardArrowDown as KeyboardArrowDownIcon } from '@mui/icons-material';
import type { OpenCDACollapsibleSectionProps } from '../types/SimConfigModalTypes';

export default function OpenCDACollapsibleSection({
  title,
  defaultExpanded = false,
  children,
}: OpenCDACollapsibleSectionProps) {
  return (
    <Accordion
      disableGutters
      elevation={0}
      defaultExpanded={defaultExpanded}
      className="sim-config-collapsible"
    >
      <AccordionSummary
        expandIcon={<KeyboardArrowDownIcon fontSize="small" />}
        className="sim-config-collapsible__summary"
      >
        <Typography className="sim-config-collapsible__title" variant="body2">
          {title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails className="sim-config-collapsible__details">
        {children}
      </AccordionDetails>
    </Accordion>
  );
}
