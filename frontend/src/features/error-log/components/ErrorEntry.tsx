import {
  Accordion,
  AccordionSummary,
  Chip,
  Typography,
  AccordionDetails,
} from '@mui/material';
import { Stack, Box } from '@mui/system';
import { memo } from 'react';
import {
  EMPTY_STATE_MESSAGE,
  SOURCE_COLOR,
  SOURCE_LABEL,
} from '../constants/ErrorLogModal.constants';
import type { ErrorEntryProps } from '../types/ErrorLogModalTypes';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import '../styles/ErrorLogModal.scss';
export const ErrorEntry = memo(({ entry }: ErrorEntryProps) => {
  const time = new Date(entry.timestamp).toLocaleTimeString();
  const sourceColor = SOURCE_COLOR[entry.source];
  const sourceLabel = SOURCE_LABEL[entry.source];

  return (
    <Accordion disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack
          direction="row"
          spacing={1}
          className="error-log__entry-summary"
          sx={{
            alignItems: 'center',
          }}
        >
          <Chip size="small" color={sourceColor} label={sourceLabel} />
          <Typography
            variant="caption"
            className="error-log__time"
            sx={{
              color: 'text.secondary',
            }}
          >
            {time}
          </Typography>
          <Typography variant="body2" className="error-log__message">
            {entry.message}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={0.5}>
          {entry.context && (
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
              }}
            >
              {entry.context}
            </Typography>
          )}
          <Box component="pre" className="error-log__stack">
            {entry.stack || entry.message}
          </Box>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
});
ErrorEntry.displayName = 'ErrorEntry';

export const EmptyState = () => (
  <Typography
    sx={{
      color: 'text.secondary',
    }}
  >
    {EMPTY_STATE_MESSAGE}
  </Typography>
);
