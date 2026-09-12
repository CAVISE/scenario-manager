import React from 'react';
import { Box, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { ScenarioListItem } from '@/api/types/IScenarioTypes';
import {
  boxStyles,
  cardAnnotationEmptyStyles,
  cardAnnotationStyles,
  cardBodyStyles,
  cardChevronStyles,
  cardIdStyles,
  cardThumbWrapStyles,
  cardTitleStyles,
  imgStyles,
  scenarioCardStyles,
} from '../types/UploadScenariosModalTypes';

interface ScenarioCardProps {
  scenario: ScenarioListItem;
  onScenarioSelect: (scenario: ScenarioListItem) => void;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenario,
  onScenarioSelect,
}) => {
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

  const handleClick = () => {
    onScenarioSelect(scenario);
  };

  return (
    <Box
      sx={scenarioCardStyles}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
    >
      <Box sx={cardThumbWrapStyles}>
        {thumb ? (
          <img
            src={thumb}
            alt={scenario.name}
            loading="lazy"
            style={imgStyles as React.CSSProperties}
          />
        ) : (
          <Box sx={boxStyles}>No preview</Box>
        )}
      </Box>

      <Box sx={cardBodyStyles}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Typography
            variant="subtitle1"
            noWrap
            sx={cardTitleStyles}
            title={scenario.name}
          >
            {scenario.name}
          </Typography>
          <Typography variant="caption" noWrap sx={cardIdStyles}>
            {scenario.scenario_id}
          </Typography>
        </Box>

        {scenario.annotation ? (
          <Typography
            variant="body2"
            sx={cardAnnotationStyles}
            title={scenario.annotation}
          >
            {scenario.annotation}
          </Typography>
        ) : (
          <Typography variant="body2" sx={cardAnnotationEmptyStyles}>
            No description
          </Typography>
        )}
      </Box>

      <Box sx={cardChevronStyles}>
        <ArrowBackIcon fontSize="small" sx={{ transform: 'rotate(180deg)' }} />
      </Box>
    </Box>
  );
};

export default ScenarioCard;
