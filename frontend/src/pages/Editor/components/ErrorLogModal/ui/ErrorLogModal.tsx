import { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { ContentCopy as ContentCopyIcon } from '@mui/icons-material';
import { DeleteOutline as DeleteOutlineIcon } from '@mui/icons-material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useEditorStore } from '@/store';
import type { ErrorLogEntry } from '@/store/types/useEditorStoreTypes';
import {
  SOURCE_COLOR,
  SOURCE_LABEL,
  type ErrorLogModalProps,
} from '../types/ErrorLogModalTypes';

function formatEntryForCopy(entry: ErrorLogEntry): string {
  const time = new Date(entry.timestamp).toISOString();
  const lines = [`[${time}] (${SOURCE_LABEL[entry.source]}) ${entry.message}`];
  if (entry.context) lines.push(`  context: ${entry.context}`);
  if (entry.stack) lines.push(entry.stack);
  return lines.join('\n');
}

function ErrorLogModal({ open, onClose }: ErrorLogModalProps) {
  const errorLog = useEditorStore((s) => s.errorLog);
  const clearErrorLog = useEditorStore((s) => s.clearErrorLog);
  const [copied, setCopied] = useState(false);

  const handleCopyAll = async () => {
    const text = errorLog.map(formatEntryForCopy).join('\n\n');
    try {
      await navigator.clipboard.writeText(
        text || 'No errors logged this session.'
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail (permissions, insecure context)
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Error log
        </Typography>
        {errorLog.length > 0 && <Chip size="small" label={errorLog.length} />}
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {errorLog.length === 0 ? (
          <Typography color="text.secondary">
            No errors logged this session. Anything that reaches console.error,
            an uncaught exception, an unhandled promise rejection, or a failed
            API call will show up here.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {[...errorLog].reverse().map((entry) => (
              <Accordion key={entry.id} disableGutters>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ minWidth: 0, width: '100%' }}
                  >
                    <Chip
                      size="small"
                      color={SOURCE_COLOR[entry.source]}
                      label={SOURCE_LABEL[entry.source]}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ flexShrink: 0 }}
                    >
                      {new Date(entry.timestamp).toLocaleTimeString()}
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
            ))}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          color="error"
          startIcon={<DeleteOutlineIcon />}
          onClick={clearErrorLog}
          disabled={errorLog.length === 0}
        >
          Clear
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="contained"
          startIcon={<ContentCopyIcon />}
          onClick={handleCopyAll}
        >
          {copied ? 'Copied!' : 'Copy for bug report'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ErrorLogModal;
