import { ContentCopyOutlined as DuplicateIcon } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import { useEditorStore } from '@/store';
import { duplicateSelectedObject } from '../model/duplicateSelectedObject';

type Props = { readOnly: boolean };

export function EditorObjectActions({ readOnly }: Props) {
  const selectedCount = useEditorStore((state) => state.selectedObjects.length);

  return (
    <div className="editor-tool-group" aria-label="Selected object actions">
      <Tooltip title="Duplicate selected object (offset by 2 m)">
        <span>
          <IconButton
            size="small"
            disabled={readOnly || selectedCount !== 1}
            onClick={duplicateSelectedObject}
            aria-label="Duplicate selected object"
          >
            <DuplicateIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </div>
  );
}
