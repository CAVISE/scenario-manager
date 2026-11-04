import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Typography,
} from '@mui/material';
import type { ScenarioListItem } from '@/api/types/IScenarioTypes';
import { getApiErrorMessageSync } from '@/api/errors';

import ScenarioCard from './ScenarioCard';

type ScenarioSelectionListProps = {
  scenarios: ScenarioListItem[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  onSelect: (scenario: ScenarioListItem) => void;
};

export const ScenarioSelectionList = ({
  scenarios,
  isLoading,
  isError,
  error,
  onRetry,
  onSelect,
}: ScenarioSelectionListProps) => (
  <>
    {isError && (
      <Alert
        severity="error"
        className="upload-scenarios-modal__alert"
        action={
          <Button color="inherit" size="small" onClick={onRetry}>
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
            onScenarioSelect={onSelect}
          />
        ))}
      </Box>
    )}
  </>
);
