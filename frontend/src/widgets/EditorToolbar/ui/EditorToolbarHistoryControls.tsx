import { IconButton, Tooltip } from '@mui/material';
import { Redo as RedoIcon, Undo as UndoIcon } from '@mui/icons-material';

type EditorToolbarHistoryControlsProps = {
  readOnly: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
};

export const EditorToolbarHistoryControls = ({
  readOnly,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: EditorToolbarHistoryControlsProps) => (
  <div className="editor-toolbar__group editor-toolbar__group--separated">
    <Tooltip title="Undo (Ctrl+Z)">
      <span>
        <IconButton
          size="small"
          aria-label="Undo"
          onClick={onUndo}
          disabled={readOnly || !canUndo}
        >
          <UndoIcon fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>
    <Tooltip title="Redo (Ctrl+Shift+Z)">
      <span>
        <IconButton
          size="small"
          aria-label="Redo"
          onClick={onRedo}
          disabled={readOnly || !canRedo}
        >
          <RedoIcon fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>
  </div>
);
