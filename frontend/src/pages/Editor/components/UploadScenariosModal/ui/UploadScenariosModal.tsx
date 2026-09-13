import React, { useState, useCallback } from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNoticeWithToast } from '@/components/AppToast';
import { getApiErrorMessageSync } from '@/api/errors';
import { ScenarioListItem } from '@/api/types/IScenarioTypes';
import { useHooks } from '@editor/context';
import {
  useScenariosListQuery,
  useScenarioPatchMutation,
} from '@editor/hooks/useApiHooks/useScenarioQueries';
import { handleLoad } from '@right-panel/components/ScenarioControlWidget/Handlers';

import {
  ACCENT,
  alertStyles,
  backButtonStyles,
  closeButtonStyles,
  detailImagePlaceholderStyles,
  detailImageStyles,
  emptyStateStyles,
  fieldStyles,
  listContainerStyles,
  loadButtonStyles,
  ModalContainer,
  ModalContainerStyles,
  ModalHeader,
  saveButtonStyles,
  titleStyles,
  uploadModalBoxStyles,
  type UploadScenariosModalProps,
} from '../types/UploadScenariosModalTypes';

import ScenarioCard from '../components/ScenarioCard';

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

const UploadScenariosModal: React.FC<UploadScenariosModalProps> = ({
  open,
  onClose,
}) => {
  const [selectedScenario, setSelectedScenario] =
    useState<ScenarioListItem | null>(null);
  const [editedDescription, setEditedDescription] = useState('');
  const [notice, setNotice] = useState('');
  const setNoticeWithToast = useNoticeWithToast(setNotice, {
    defaultLevel: 'info',
  });
  const [loadingScene, setLoadingScene] = useState(false);

  const {
    data: scenarios = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useScenariosListQuery(open);

  const patchScenarioMutation = useScenarioPatchMutation();
  const { updateSceneGraph, loadFile, setStep } = useHooks();

  const handleSelectScenario = (scenario: ScenarioListItem) => {
    setSelectedScenario(scenario);
    setEditedDescription(scenario.annotation || '');
    setNotice('');
  };

  const handleBack = () => {
    setSelectedScenario(null);
    setEditedDescription('');
    setNotice('');
  };

  const handleClose = useCallback(() => {
    setSelectedScenario(null);
    setEditedDescription('');
    setNotice('');
    onClose();
  }, [onClose]);

  const isDescriptionDirty =
    !!selectedScenario &&
    editedDescription !== (selectedScenario.annotation || '');

  const handleSaveDescription = useCallback(async () => {
    if (!selectedScenario?.scenario_id) return;
    try {
      await patchScenarioMutation.mutateAsync({
        id: selectedScenario.scenario_id,
        payload: { description: editedDescription },
      });
      setSelectedScenario((prev) =>
        prev ? { ...prev, annotation: editedDescription } : prev
      );
      setNoticeWithToast('Description saved');
      refetch();
    } catch (err) {
      setNoticeWithToast(
        getApiErrorMessageSync(err, 'Failed to save description')
      );
    }
  }, [
    selectedScenario,
    editedDescription,
    patchScenarioMutation,
    setNoticeWithToast,
    refetch,
  ]);

  const handleLoadOnScene = useCallback(async () => {
    if (!selectedScenario?.scenario_id) return;
    setLoadingScene(true);
    setNotice('');
    try {
      await handleLoad({
        hasId: true,
        scenarioIdInput: selectedScenario.scenario_id,
        setNotice: setNoticeWithToast,
        updateSceneGraph,
        loadFile,
        setStep,
      });
    } finally {
      setLoadingScene(false);
      handleClose();
    }
  }, [
    selectedScenario,
    updateSceneGraph,
    setNoticeWithToast,
    loadFile,
    setStep,
    handleClose,
  ]);

  const thumb = selectedScenario
    ? previewSrc(selectedScenario.preview)
    : undefined;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="upload-scenarios-title"
    >
      <ModalContainer
        role="dialog"
        aria-modal="true"
        aria-label="Load Scenario"
        tabIndex={-1}
        sx={{
          ...ModalContainerStyles,
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderColor: 'divider',
        }}
      >
        <ModalHeader>
          <Box sx={uploadModalBoxStyles}>
            {selectedScenario && (
              <IconButton
                size="small"
                aria-label="Back to scenarios"
                onClick={handleBack}
                sx={backButtonStyles}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            )}
            <Typography
              id="upload-scenarios-title"
              variant="h6"
              component="h2"
              sx={titleStyles}
            >
              {selectedScenario ? selectedScenario.name : 'Load Scenario'}
            </Typography>
          </Box>
          <IconButton
            onClick={handleClose}
            size="small"
            aria-label="close"
            sx={closeButtonStyles}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </ModalHeader>

        {notice && (
          <Alert severity="info" sx={alertStyles} onClose={handleClose}>
            {notice}
          </Alert>
        )}

        {selectedScenario === null ? (
          <>
            {isError && (
              <Alert
                severity="error"
                sx={alertStyles}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => refetch()}
                  >
                    Retry
                  </Button>
                }
              >
                {getApiErrorMessageSync(error, 'Failed to load scenario list')}
              </Alert>
            )}
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={28} sx={{ color: ACCENT }} />
              </Box>
            ) : (
              <Box sx={listContainerStyles}>
                {scenarios.length === 0 && (
                  <Box sx={emptyStateStyles}>
                    <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
                      No saved scenarios
                    </Typography>
                  </Box>
                )}
                {scenarios.map((scenario) => (
                  <ScenarioCard
                    key={scenario.scenario_id}
                    scenario={scenario}
                    onScenarioSelect={handleSelectScenario}
                  />
                ))}
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {thumb ? (
              <Box
                component="img"
                src={thumb}
                alt={selectedScenario.name}
                sx={detailImageStyles}
              />
            ) : (
              <Box sx={detailImagePlaceholderStyles}>No preview</Box>
            )}
            <TextField
              label="ID"
              value={selectedScenario.scenario_id}
              InputProps={{ readOnly: true }}
              fullWidth
              variant="outlined"
              sx={fieldStyles}
            />
            <TextField
              label="Description"
              placeholder="Enter scenario description"
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              multiline
              rows={3}
              fullWidth
              variant="outlined"
              sx={fieldStyles}
            />
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={handleSaveDescription}
                disabled={
                  !isDescriptionDirty || patchScenarioMutation.isPending
                }
                sx={saveButtonStyles}
              >
                {patchScenarioMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
              <Button
                variant="contained"
                onClick={handleLoadOnScene}
                disabled={loadingScene}
                sx={loadButtonStyles}
              >
                {loadingScene ? 'Loading…' : 'Load onto scene'}
              </Button>
            </Box>
          </Box>
        )}
      </ModalContainer>
    </Modal>
  );
};

export default UploadScenariosModal;
