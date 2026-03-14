import React, { useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Grid,
} from '@mui/material';

import AspectRatio from '@mui/joy/AspectRatio';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { MockScenario, MOCK_SCENARIOS, ModalContainer, ModalHeader, ScenarioCard } from './types/UploadScenariosModalTypes';
import type { UploadScenariosModalProps } from './types/UploadScenariosModalTypes';

const UploadScenariosModal: React.FC<UploadScenariosModalProps> = ({ open, onClose }) => {
  const [selectedScenario, setSelectedScenario] = useState<MockScenario | null>(null);
  const [description, setDescription] = useState('');

  const handleSelectScenario = (scenario: MockScenario) => {
    setSelectedScenario(scenario);
    setDescription(scenario.description);
  };

  const handleBack = () => {
    setSelectedScenario(null);
  };

  const handleClose = () => {
    setSelectedScenario(null);
    onClose();
  };

  const handleSubmit = () => {
    console.log('Upload scenario submitted:', {
      id: selectedScenario!.id,
      name: selectedScenario!.name,
      description,
    });
  };

  return (
    <Modal open={open} onClose={handleClose} aria-labelledby="upload-scenarios-title">
      <ModalContainer>
        <ModalHeader>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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

        {selectedScenario === null ? (
          <Grid container spacing={2}>
            {MOCK_SCENARIOS.map((scenario) => (
              <Grid item xs={12} sm={6} md={4} key={scenario.id}>
                <ScenarioCard onClick={() => handleSelectScenario(scenario)}>
                  <AspectRatio ratio="16/9" sx={{ minHeight: 140 }}>
                    <img
                      src={scenario.thumbnail}
                      alt={scenario.name}
                      loading="lazy"
                      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    />
                  </AspectRatio>
                  <Box sx={{ p: 1.5 }}>
                    <Typography variant="subtitle2" noWrap>
                      {scenario.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {scenario.id}
                    </Typography>
                  </Box>
                </ScenarioCard>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box
              component="img"
              src={selectedScenario.thumbnail}
              alt={selectedScenario.name}
              sx={{
                width: '100%',
                maxHeight: 400,
                objectFit: 'contain',
                borderRadius: 1,
                bgcolor: '#f5f5f5',
              }}
            />
            <TextField
              label="ID"
              value={selectedScenario.id}
              InputProps={{ readOnly: true }}
              fullWidth
              variant="outlined"
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={3}
              fullWidth
              variant="outlined"
            />
            <Button
              variant="contained"
              onClick={handleSubmit}
              sx={{ alignSelf: 'flex-end' }}
            >
              Submit
            </Button>
          </Box>
        )}
      </ModalContainer>
    </Modal>
  );
};

export default UploadScenariosModal;
