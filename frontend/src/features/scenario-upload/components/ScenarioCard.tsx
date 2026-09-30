import React from 'react';
import { Box, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import type { ScenarioCardProps } from '../types/UploadScenariosModalTypes';
import { getScenarioPreviewSrc } from '../utils/previewSrc';

const ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenario,
  onScenarioSelect,
}) => {
  const thumb = getScenarioPreviewSrc(scenario.preview);

  const handleClick = () => {
    onScenarioSelect(scenario);
  };

  return (
    <Box
      className="upload-scenarios-modal__card"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
    >
      <Box className="upload-scenarios-modal__thumbnail">
        {thumb ? (
          <img
            src={thumb}
            alt={scenario.name}
            loading="lazy"
            className="upload-scenarios-modal__thumbnail-image"
          />
        ) : (
          <Box className="upload-scenarios-modal__thumbnail-placeholder">
            No preview
          </Box>
        )}
      </Box>

      <Box className="upload-scenarios-modal__card-body">
        <Box className="upload-scenarios-modal__card-heading">
          <Typography
            variant="subtitle1"
            noWrap
            className="upload-scenarios-modal__card-title"
            title={scenario.name}
          >
            {scenario.name}
          </Typography>
          <Typography
            className="upload-scenarios-modal__card-id"
            variant="caption"
            noWrap
          >
            {scenario.scenario_id}
          </Typography>
        </Box>

        {scenario.annotation ? (
          <Typography
            variant="body2"
            className="upload-scenarios-modal__card-description"
            title={scenario.annotation}
          >
            {scenario.annotation}
          </Typography>
        ) : (
          <Typography
            className="upload-scenarios-modal__card-description-empty"
            variant="body2"
          >
            No description
          </Typography>
        )}
      </Box>

      <Box className="upload-scenarios-modal__card-chevron">
        <ArrowBackIcon fontSize="small" />
      </Box>
    </Box>
  );
};

export default ScenarioCard;
