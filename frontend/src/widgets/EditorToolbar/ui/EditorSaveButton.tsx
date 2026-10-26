import { Badge, Button, Tooltip } from '@mui/material';
import { SaveOutlined } from '@mui/icons-material';
import { useEditorStore } from '@/store';
import { hasUnsavedScenarioChanges } from '@/shared/lib/scenarioDraftFingerprint';

type Props = {
  readOnly: boolean;
  isSaving: boolean;
  onSave?: () => void;
};

export function EditorSaveButton({ readOnly, isSaving, onSave }: Props) {
  const hasUnsavedChanges = useEditorStore(hasUnsavedScenarioChanges);
  const label = isSaving
    ? 'Saving…'
    : hasUnsavedChanges
      ? 'Save changes'
      : 'Saved';

  return (
    <Tooltip
      title={
        hasUnsavedChanges
          ? 'Unsaved server changes. Your local draft is backed up automatically.'
          : 'All changes saved'
      }
    >
      <span>
        <Button
          className="editor-save-button"
          variant="contained"
          size="small"
          startIcon={
            <Badge color="warning" variant="dot" invisible={!hasUnsavedChanges}>
              <SaveOutlined />
            </Badge>
          }
          disabled={readOnly}
          onClick={onSave}
        >
          {label}
        </Button>
      </span>
    </Tooltip>
  );
}
