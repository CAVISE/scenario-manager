import { ErrorLogEntry } from '@/store/types/useEditorStoreTypes';
import {
  Accordion,
  AccordionSummary,
  Chip,
  Typography,
  AccordionDetails,
} from '@mui/material';
import { Stack, Box } from '@mui/system';
import { memo } from 'react';
import { EMPTY_STATE_MESSAGE } from '../constants/ErrorLogModal.constants';
import { SOURCE_COLOR, SOURCE_LABEL } from '../types/ErrorLogModalTypes';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
export const ErrorEntry = memo(({ entry }: { entry: ErrorLogEntry }) => {
  const time = new Date(entry.timestamp).toLocaleTimeString();
  const sourceColor = SOURCE_COLOR[entry.source];
  const sourceLabel = SOURCE_LABEL[entry.source];

  return (
    <Accordion disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ minWidth: 0, width: '100%' }}
        >
          <Chip size="small" color={sourceColor} label={sourceLabel} />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ flexShrink: 0 }}
          >
            {time}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {entry.message}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={0.5}>
          {entry.context && (
            <Typography variant="caption" color="text.secondary">
              {entry.context}
            </Typography>
          )}
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 1,
              borderRadius: 1,
              bgcolor: 'action.hover',
              fontSize: '0.75rem',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {entry.stack || entry.message}
          </Box>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
});
ErrorEntry.displayName = 'ErrorEntry';

export const EmptyState = () => (
  <Typography color="text.secondary">{EMPTY_STATE_MESSAGE}</Typography>
);
