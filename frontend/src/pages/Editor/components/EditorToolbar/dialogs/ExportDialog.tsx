import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";

interface ExportDialogProps {
  open: boolean;
  filename: string;
  onFilenameChange: (name: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ExportDialog({ open, filename, onFilenameChange, onConfirm, onClose }: ExportDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Save export as</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="File name"
          fullWidth
          variant="outlined"
          value={filename}
          onChange={e => onFilenameChange(e.target.value)}
          onKeyDown={e => {
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
        <Button variant="contained" onClick={onConfirm}>Download</Button>
      </DialogActions>
    </Dialog>
  );
}