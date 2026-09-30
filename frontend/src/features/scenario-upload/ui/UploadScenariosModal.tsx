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
import { useNoticeWithToast } from '@/shared/ui/AppToast';
import { getApiErrorMessageSync } from '@/api/errors';
import { ScenarioListItem } from '@/api/types/IScenarioTypes';
import { useHooks } from '@editor/context';
import {
  useScenariosListQuery,
  useScenarioPatchMutation,
} from '@editor/hooks/useApiHooks/useScenarioQueries';
import { handleLoad } from '@right-panel/components/ScenarioControlWidget/Handlers';
import type { UploadScenariosModalProps } from '../types/UploadScenariosModalTypes';
import { getScenarioPreviewSrc } from '../utils/previewSrc';
import ScenarioCard from '../components/ScenarioCard';
import '../styles/UploadScenariosModal.scss';

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
    ? getScenarioPreviewSrc(selectedScenario.preview)
    : undefined;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="upload-scenarios-title"
    >
      <Box className="upload-scenarios-modal">
        <Box className="upload-scenarios-modal__header">
          <Box className="upload-scenarios-modal__title-group">
            {selectedScenario && (
              <IconButton
                size="small"
                onClick={handleBack}
                className="upload-scenarios-modal__icon-button"
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            )}
            <Typography
              id="upload-scenarios-title"
              variant="h6"
              component="h2"
              className="upload-scenarios-modal__title"
            >
              {selectedScenario ? selectedScenario.name : 'Load Scenario'}
            </Typography>
          </Box>
          <IconButton
            onClick={handleClose}
            size="small"
            aria-label="close"
            className="upload-scenarios-modal__icon-button"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {notice && (
          <Alert
            className="upload-scenarios-modal__alert"
            severity="info"
            onClose={handleClose}
          >
            {notice}
          </Alert>
        )}

        {selectedScenario === null ? (
          <>
            {isError && (
              <Alert
                severity="error"
                className="upload-scenarios-modal__alert"
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
              <Box className="upload-scenarios-modal__loading">
                <CircularProgress size={28} />
              </Box>
            ) : (
              <Box className="upload-scenarios-modal__list">
                {scenarios.length === 0 && (
                  <Box className="upload-scenarios-modal__empty">
                    <Typography className="upload-scenarios-modal__empty-text">
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
          <Box className="upload-scenarios-modal__detail">
            {thumb ? (
              <Box
                component="img"
                src={thumb}
                alt={selectedScenario.name}
                className="upload-scenarios-modal__detail-image"
              />
            ) : (
              <Box className="upload-scenarios-modal__detail-placeholder">
                No preview
              </Box>
            )}
            <TextField
              label="ID"
              value={selectedScenario.scenario_id}
              InputProps={{ readOnly: true }}
              fullWidth
              variant="outlined"
              className="upload-scenarios-modal__field"
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
              className="upload-scenarios-modal__field"
            />
            <Box className="upload-scenarios-modal__actions">
              <Button
                variant="outlined"
                onClick={handleSaveDescription}
                disabled={
                  !isDescriptionDirty || patchScenarioMutation.isPending
                }
                className="upload-scenarios-modal__button upload-scenarios-modal__button--secondary"
              >
                {patchScenarioMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
              <Button
                variant="contained"
                onClick={handleLoadOnScene}
                disabled={loadingScene}
                className="upload-scenarios-modal__button upload-scenarios-modal__button--primary"
              >
                {loadingScene ? 'Loading…' : 'Load onto scene'}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Modal>
  );
};

export default UploadScenariosModal;
