import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import type { OpenCDACollapsibleSectionProps } from './SimConfigModal.types';
import { openCdaAccordionSx } from './SimConfigModal.constants';

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
      sx={openCdaAccordionSx}
    >
      <AccordionSummary
        expandIcon={<KeyboardArrowDownIcon fontSize="small" />}
        sx={{
          minHeight: 44,
          '& .MuiAccordionSummary-content': { my: 0.75 },
          bgcolor: (theme) =>
            theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.02)'
              : 'rgba(15, 23, 42, 0.03)',
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0, pb: 2, px: 2 }}>
        {children}
      </AccordionDetails>
    </Accordion>
  );
}
