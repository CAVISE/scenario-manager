import React, { useState, useCallback, useRef } from 'react';
import { Modal, Box, Typography, IconButton, Alert } from '@mui/material';
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
import { ScenarioSelectionList } from '../components/ScenarioSelectionList';
import { SelectedScenarioDetails } from '../components/SelectedScenarioDetails';
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
  const selectionRequestRef = useRef(0);
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
    selectionRequestRef.current += 1;
    setSelectedScenario(scenario);
    setEditedDescription(scenario.annotation || '');
    setNotice('');
  };
  const handleBack = () => {
    selectionRequestRef.current += 1;
    setSelectedScenario(null);
    setEditedDescription('');
    setNotice('');
  };

  const handleClose = useCallback(() => {
    selectionRequestRef.current += 1;
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
    const requestId = selectionRequestRef.current;
    const scenarioId = selectedScenario.scenario_id;
    const description = editedDescription;
    try {
      await patchScenarioMutation.mutateAsync({
        id: scenarioId,
        payload: { description },
      });
      if (requestId !== selectionRequestRef.current) return;
      setSelectedScenario((prev) =>
        prev?.scenario_id === scenarioId
          ? { ...prev, annotation: description }
          : prev
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
    const requestId = selectionRequestRef.current;
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
        isCurrent: () => requestId === selectionRequestRef.current,
      });
    } finally {
      if (requestId === selectionRequestRef.current) {
        setLoadingScene(false);
        handleClose();
      }
    }
  }, [
    selectedScenario,
    updateSceneGraph,
    setNoticeWithToast,
    loadFile,
    setStep,
    handleClose,
  ]);

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
          <ScenarioSelectionList
            scenarios={scenarios}
            isLoading={isLoading}
            isError={isError}
            error={error}
            onRetry={refetch}
            onSelect={handleSelectScenario}
          />
        ) : (
          <SelectedScenarioDetails
            scenario={selectedScenario}
            description={editedDescription}
            isDescriptionDirty={isDescriptionDirty}
            isSaving={patchScenarioMutation.isPending}
            isLoading={loadingScene}
            onDescriptionChange={setEditedDescription}
            onSave={handleSaveDescription}
            onLoad={handleLoadOnScene}
          />
        )}
      </Box>
    </Modal>
  );
};

export default UploadScenariosModal;
