import { useState, useMemo } from 'react';
import {
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
import {
  Close as CloseIcon,
  ContentCopy as ContentCopyIcon,
  DeleteOutline as DeleteOutlineIcon,
} from '@mui/icons-material';
import { useEditorStore } from '@/store';
import { type ErrorLogModalProps } from '../types/ErrorLogModalTypes';
import { COPY_FEEDBACK_DURATION } from '../constants/ErrorLogModal.constants';
import { formatEntryForCopy } from '../utils/ErrorLogModal.utils';
import { EmptyState, ErrorEntry } from '../components/ErrorEntry';

function ErrorLogModal({ open, onClose }: ErrorLogModalProps) {
  const errorLog = useEditorStore((s) => s.errorLog);
  const clearErrorLog = useEditorStore((s) => s.clearErrorLog);
  const [copied, setCopied] = useState(false);

  const reversedLog = useMemo(() => [...errorLog].reverse(), [errorLog]);

  const handleCopyAll = async () => {
    const text = errorLog.map(formatEntryForCopy).join('\n\n');
    try {
      await navigator.clipboard.writeText(
        text || 'No errors logged this session.'
      );
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION);
    } catch {
      // Clipboard API can fail (permissions, insecure context)
    }
  };

  const hasErrors = errorLog.length > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Error log
        </Typography>
        {hasErrors && <Chip size="small" label={errorLog.length} />}
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {!hasErrors ? (
          <EmptyState />
        ) : (
          <Stack spacing={1}>
            {reversedLog.map((entry) => (
              <ErrorEntry key={entry.id} entry={entry} />
            ))}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          color="error"
          startIcon={<DeleteOutlineIcon />}
          onClick={clearErrorLog}
          disabled={!hasErrors}
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
