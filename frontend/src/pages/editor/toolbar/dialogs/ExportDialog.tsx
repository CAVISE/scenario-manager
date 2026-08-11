import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import type { ExportDialogProps } from '../EditorToolbar.types';

export default function ExportDialog({
  open,
  filename,
  onFilenameChange,
  onConfirm,
  onClose,
}: ExportDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Save export as</DialogTitle>
      <DialogContent>
        <TextField
          key="filename"
          autoFocus
          margin="dense"
          label="File name"
          fullWidth
          variant="outlined"
          value={filename}
          onChange={(e) => onFilenameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onConfirm();
            }
          }}
          helperText="Extension is included in the name. Invalid characters are replaced."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onConfirm}>
          Download
        </Button>
      </DialogActions>
    </Dialog>
  );
}
