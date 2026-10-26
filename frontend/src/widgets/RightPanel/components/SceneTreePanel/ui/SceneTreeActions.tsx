import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Menu,
  MenuItem,
} from '@mui/material';
import { useEditorStore } from '@/store';
import { useEditorRefs } from '@editor/context';
import { deleteSelectedObjects } from '../../MultiSelectionProperties/model/batchActions';
import { watchHistoryEntryValidity } from '../funcs/deletionSnapshots/ui/deletionSnapshots';
import { useAppToast } from '@/shared/ui/AppToast';
import { invalidateEditorScene } from '@editor/lib/invalidateEditorScene';

type SceneTreeActionsProps = {
  readOnly: boolean;
  allIds: string[];
  visibleIds: string[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onClearHover: () => void;
};

export const SceneTreeActions = ({
  readOnly,
  allIds,
  visibleIds,
  selectedIds,
  onSelect,
  onClearHover,
}: SceneTreeActionsProps) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const toast = useAppToast();
  const { transformControlsRef } = useEditorRefs();
  const remove = (getMessage: (count: number) => string) => {
    transformControlsRef.current?.detach();
    onClearHover();
    const result = deleteSelectedObjects();
    if (result) {
      invalidateEditorScene();
      toast.undo(
        getMessage(result.count),
        () => useEditorStore.getState().undo(),
        undefined,
        watchHistoryEntryValidity(result.entryId)
      );
    }
  };
  return (
    <>
      <button
        type="button"
        className="stp-menu-button"
        aria-label="Scene actions"
        aria-haspopup="menu"
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        ⋯
      </button>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
      >
        <MenuItem
          disabled={!visibleIds.length}
          onClick={() => {
            onSelect(visibleIds);
            setAnchor(null);
          }}
        >
          Select all shown
        </MenuItem>
        <MenuItem
          disabled={!selectedIds.length}
          onClick={() => {
            onSelect([]);
            setAnchor(null);
          }}
        >
          Clear selection
        </MenuItem>
        <MenuItem
          disabled={readOnly || !selectedIds.length}
          onClick={() => {
            setAnchor(null);
            remove((count) => `${count} objects deleted`);
          }}
        >
          Delete selected
        </MenuItem>
        <MenuItem
          disabled={readOnly || !allIds.length}
          onClick={() => {
            setAnchor(null);
            setClearOpen(true);
          }}
        >
          Clear scene…
        </MenuItem>
      </Menu>
      <Dialog
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        aria-labelledby="clear-scene-title"
      >
        <DialogTitle id="clear-scene-title">Clear scene?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Remove all {allIds.length} objects and their routes and sensors? You
            can restore them with Undo.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearOpen(false)}>Cancel</Button>
          <Button
            color="error"
            disabled={readOnly}
            onClick={() => {
              if (
                readOnly ||
                useEditorStore.getState().simulationSession.phase === 'running'
              )
                return;
              onSelect(allIds);
              remove(() => 'Scene cleared');
              setClearOpen(false);
            }}
          >
            Clear scene
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
