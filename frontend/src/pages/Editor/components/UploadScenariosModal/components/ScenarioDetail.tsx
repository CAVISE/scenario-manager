import React, { useState, useCallback } from 'react';
import { Box, TextField, Button } from '@mui/material';
import { ScenarioListItem } from '@/api/types/IScenarioTypes';
import {
  detailImageStyles,
  detailImagePlaceholderStyles,
  fieldStyles,
  saveButtonStyles,
  loadButtonStyles,
} from '../types/UploadScenariosModalTypes';

interface ScenarioDetailProps {
  scenario: ScenarioListItem;
  onSave: (id: string, description: string) => Promise<void>;
  onLoad: () => Promise<void>;
  isSaving: boolean;
  isLoading: boolean;
}

const ScenarioDetail: React.FC<ScenarioDetailProps> = ({
  scenario,
  onSave,
  onLoad,
  isSaving,
  isLoading,
}) => {
  const [description, setDescription] = useState(scenario.annotation || '');
  const isDirty = description !== (scenario.annotation || '');

  const previewSrc = (preview: string | null): string | undefined => {
    if (!preview) return undefined;
    if (
      preview.startsWith('data:') ||
      preview.startsWith('http://') ||
      preview.startsWith('https://') ||
      preview.startsWith('/')
    ) {
      return preview;
    }
    return `data:image/png;base64,${preview}`;
  };

  const thumb = previewSrc(scenario.preview);

  const handleSave = useCallback(() => {
    onSave(scenario.scenario_id, description);
  }, [scenario.scenario_id, description, onSave]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {thumb ? (
        <Box
          component="img"
          src={thumb}
          alt={scenario.name}
          sx={detailImageStyles}
        />
      ) : (
        <Box sx={detailImagePlaceholderStyles}>No preview</Box>
      )}

      <TextField
        label="ID"
        value={scenario.scenario_id}
        InputProps={{ readOnly: true }}
        fullWidth
        variant="outlined"
        sx={fieldStyles}
      />

      <TextField
        label="Description"
        placeholder="Enter scenario description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        multiline
        rows={3}
        fullWidth
        variant="outlined"
        sx={fieldStyles}
      />

      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
        <Button
          variant="outlined"
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          sx={saveButtonStyles}
        >
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
        <Button
          variant="contained"
          onClick={onLoad}
          disabled={isLoading}
          sx={loadButtonStyles}
        >
          {isLoading ? 'Loading…' : 'Load onto scene'}
        </Button>
      </Box>
    </Box>
  );
};

export default ScenarioDetail;
