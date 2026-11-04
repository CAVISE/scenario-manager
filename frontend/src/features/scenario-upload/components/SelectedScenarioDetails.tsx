import { Box, Button, TextField } from '@mui/material';
import type { ScenarioListItem } from '@/api/types/IScenarioTypes';

import { getScenarioPreviewSrc } from '../utils/previewSrc';

type SelectedScenarioDetailsProps = {
  scenario: ScenarioListItem;
  description: string;
  isDescriptionDirty: boolean;
  isSaving: boolean;
  isLoading: boolean;
  onDescriptionChange: (value: string) => void;
  onSave: () => void;
  onLoad: () => void;
};

export const SelectedScenarioDetails = ({
  scenario,
  description,
  isDescriptionDirty,
  isSaving,
  isLoading,
  onDescriptionChange,
  onSave,
  onLoad,
}: SelectedScenarioDetailsProps) => {
  const thumbnail = getScenarioPreviewSrc(scenario.preview);

  return (
    <Box className="upload-scenarios-modal__detail">
      {thumbnail ? (
        <Box
          component="img"
          src={thumbnail}
          alt={scenario.name}
          className="upload-scenarios-modal__detail-image"
        />
      ) : (
        <Box className="upload-scenarios-modal__detail-placeholder">
          No preview
        </Box>
      )}
      <TextField
        label="ID"
        value={scenario.scenario_id}
        fullWidth
        variant="outlined"
        className="upload-scenarios-modal__field"
        slotProps={{
          input: { readOnly: true },
        }}
      />
      <TextField
        label="Description"
        placeholder="Enter scenario description"
        value={description}
        onChange={(event) => onDescriptionChange(event.target.value)}
        multiline
        rows={3}
        fullWidth
        variant="outlined"
        className="upload-scenarios-modal__field"
      />
      <Box className="upload-scenarios-modal__actions">
        <Button
          variant="outlined"
          onClick={onSave}
          disabled={!isDescriptionDirty || isSaving}
          className="upload-scenarios-modal__button upload-scenarios-modal__button--secondary"
        >
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
        <Button
          variant="contained"
          onClick={onLoad}
          disabled={isLoading}
          className="upload-scenarios-modal__button upload-scenarios-modal__button--primary"
        >
          {isLoading ? 'Loading…' : 'Load onto scene'}
        </Button>
      </Box>
    </Box>
  );
};
