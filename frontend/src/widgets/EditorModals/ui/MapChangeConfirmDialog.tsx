import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

type MapChangeConfirmDialogProps = {
  mapName: string | null;
  onCancel: () => void;
  onDiscard: () => void;
};

export function MapChangeConfirmDialog({
  mapName,
  onCancel,
  onDiscard,
}: MapChangeConfirmDialogProps) {
  return (
    <Dialog open={Boolean(mapName)} onClose={onCancel}>
      <DialogTitle>Discard unsaved changes?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Switching to {mapName} clears the current draft. Save the scenario
          first if you want to keep its unsaved changes.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Keep editing</Button>
        <Button color="warning" onClick={onDiscard}>
          Discard and switch map
        </Button>
      </DialogActions>
    </Dialog>
  );
}
