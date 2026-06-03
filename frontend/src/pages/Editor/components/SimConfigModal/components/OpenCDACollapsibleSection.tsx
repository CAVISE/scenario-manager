import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from '@mui/material';
import type { Theme } from '@mui/material/styles';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import type { ReactNode } from 'react';

type Props = {
  title: string;
  defaultExpanded?: boolean;
  children: ReactNode;
};

const accordionSx = {
  bgcolor: 'transparent',
  '&:before': { display: 'none' },
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1.5,
  overflow: 'hidden',
  transition: (theme: Theme) =>
    theme.transitions.create(['border-color', 'box-shadow']),
  '&.Mui-expanded': {
    borderColor: 'primary.main',
    boxShadow: (theme: { palette: { mode: string } }) =>
      theme.palette.mode === 'dark'
        ? '0 4px 20px rgba(0, 0, 0, 0.35)'
        : '0 4px 16px rgba(15, 23, 42, 0.08)',
  },
} as const;

export default function OpenCDACollapsibleSection({
  title,
  defaultExpanded = false,
  children,
}: Props) {
  return (
    <Accordion
      disableGutters
      elevation={0}
      defaultExpanded={defaultExpanded}
      sx={accordionSx}
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
      <AccordionDetails sx={{ pt: 0, pb: 2, px: 2 }}>{children}</AccordionDetails>
    </Accordion>
  );
}
