import React, { useState, useCallback } from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';

import AspectRatio from '@mui/joy/AspectRatio';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  ModalContainer,
  ModalHeader,
  ScenarioCard,
  uploadModalStyles,
  uploadModalBoxStyles,
} from '../types/UploadScenariosModalTypes';
import type { UploadScenariosModalProps } from '../types/UploadScenariosModalTypes';
import type { ScenarioListItem } from '../../../../../api/types/IScenarioTypes';
import { useScenariosListQuery } from '../../../hooks/useApiHooks/useScenarioQueries';
import { handleLoad } from '../../../../components/RightPanel/components/ScenarioControlWidget/Handlers';
import { useEditorRefs, useHooks } from '../../../context';

function previewSrc(preview: string | null): string | undefined {
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
}

const UploadScenariosModal: React.FC<UploadScenariosModalProps> = ({
  open,
  onClose,
}) => {
  const { sceneRef, loadRSURef } = useEditorRefs();
  const [selectedScenario, setSelectedScenario] =
    useState<ScenarioListItem | null>(null);
  const [notice, setNotice] = useState('');
  const [loadingScene, setLoadingScene] = useState(false);
  const {
    data: scenarios = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useScenariosListQuery(open);

  const handleSelectScenario = (scenario: ScenarioListItem) => {
    setSelectedScenario(scenario);
    setNotice('');
  };

  const handleBack = () => {
    setSelectedScenario(null);
    setNotice('');
  };

  const handleClose = () => {
    setSelectedScenario(null);
    setNotice('');
    onClose();
  };
  const { buildingModelRef, updateSceneGraph } = useHooks();
  const handleLoadOnScene = useCallback(async () => {
    if (!selectedScenario?.scenario_id) return;
    setLoadingScene(true);
    setNotice('');
    try {
      await handleLoad({
        hasId: true,
        scenarioIdInput: selectedScenario.scenario_id,
        sceneRef,
        setNotice,
        loadRSURef,
        buildingModelRef,
        updateSceneGraph,
      });
    } finally {
      setLoadingScene(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const thumb = selectedScenario
    ? previewSrc(selectedScenario.preview)
    : undefined;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="upload-scenarios-title"
    >
      <ModalContainer>
        <ModalHeader>
          <Box sx={uploadModalBoxStyles}>
            {selectedScenario && (
              <IconButton size="small" onClick={handleBack}>
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography id="upload-scenarios-title" variant="h5" component="h2">
              {selectedScenario ? selectedScenario.name : 'Load Scenario'}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small" aria-label="close">
            <CloseIcon />
          </IconButton>
        </ModalHeader>

        {notice ? (
          <Alert severity="info" sx={{ mb: 2 }} onClose={() => setNotice('')}>
            {notice}
          </Alert>
        ) : null}

        {selectedScenario === null ? (
          <>
            {isError ? (
              <Alert
                severity="error"
                sx={{ mb: 2 }}
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
                {error instanceof Error
                  ? error.message
                  : 'Failed to load scenario list'}
              </Alert>
            ) : null}
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={2}>
                {scenarios.length === 0 && !isLoading ? (
                  <Grid item xs={12}>
                    <Typography color="text.secondary">
                      No saved scenarios
                    </Typography>
                  </Grid>
                ) : null}
                {scenarios.map((scenario) => (
                  <Grid item xs={12} sm={6} md={4} key={scenario.scenario_id}>
                    <ScenarioCard
                      onClick={() => handleSelectScenario(scenario)}
                    >
                      <AspectRatio
                        ratio="16/9"
                        sx={{ minHeight: 140, bgcolor: '#eee' }}
                      >
                        {previewSrc(scenario.preview) ? (
                          <img
                            src={previewSrc(scenario.preview)}
                            alt={scenario.name}
                            loading="lazy"
                            style={{
                              objectFit: 'cover',
                              width: '100%',
                              height: '100%',
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'text.secondary',
                              fontSize: 12,
                            }}
                          >
                            No preview
                          </Box>
                        )}
                      </AspectRatio>
                      <Box sx={{ p: 1.5 }}>
                        <Typography variant="subtitle2" noWrap>
                          {scenario.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          noWrap
                        >
                          {scenario.scenario_id}
                        </Typography>
                        {scenario.annotation ? (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                            noWrap
                          >
                            {scenario.annotation}
                          </Typography>
                        ) : null}
                      </Box>
                    </ScenarioCard>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {thumb ? (
              <Box
                component="img"
                src={thumb}
                alt={selectedScenario.name}
                sx={uploadModalStyles}
              />
            ) : (
              <Box
                sx={{
                  ...uploadModalStyles,
                  minHeight: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'text.secondary',
                }}
              >
                No preview
              </Box>
            )}
            <TextField
              label="ID"
              value={selectedScenario.scenario_id}
              InputProps={{ readOnly: true }}
              fullWidth
              variant="outlined"
            />
            <TextField
              label="Description"
              value={selectedScenario.annotation ?? ''}
              multiline
              rows={3}
              fullWidth
              variant="outlined"
              InputProps={{ readOnly: true }}
            />
            <Button
              variant="contained"
              onClick={handleLoadOnScene}
              disabled={loadingScene}
              sx={{ alignSelf: 'flex-end' }}
            >
              {loadingScene ? 'Loading…' : 'Load onto scene'}
            </Button>
          </Box>
        )}
      </ModalContainer>
    </Modal>
  );
};

export default UploadScenariosModal;
